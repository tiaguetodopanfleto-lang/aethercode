const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "25mb" }));

app.use(express.static(path.join(__dirname, "../site")));

const SYSTEM = [
    "Voce e o AetherCode AI, um assistente de programacao.",
    "Responda sempre em portugues do Brasil.",
    "Seu foco principal e programacao e desenvolvimento.",
    "Ajude com Skript, Paper, Minecraft, Java, JavaScript, TypeScript, Python, HTML, CSS, Lua, Roblox, SQL, APIs e Git.",
    "Voce pode analisar imagens e arquivos enviados pelo usuario.",
    "Ao receber codigo, analise cuidadosamente antes de sugerir alteracoes.",
    "Quando o usuario pedir codigo completo, entregue o arquivo completo e pronto para copiar.",
    "Nao invente sintaxe ou APIs.",
    "Considere a versao informada pelo usuario.",
    "Se houver um erro, explique de forma clara e mostre a correcao.",
    "Se o usuario enviar um projeto ou arquivo grande, mantenha o contexto da conversa.",
    "Seja direto, claro, util e tecnico."
].join("\n");


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        ai: !!process.env.GEMINI_API_KEY,
        model:
            process.env.GEMINI_MODEL ||
            "gemini-3.6-flash"
    });
});


/* =========================
   CONVERTER HISTORICO
========================= */

function convertMessages(messages) {

    const result = [];

    if (!Array.isArray(messages)) {
        return result;
    }

    for (const message of messages) {

        if (!message) {
            continue;
        }

        const content =
            String(message.content || "");

        if (!content.trim()) {
            continue;
        }

        result.push({

            role:
                message.role === "assistant"
                    ? "model"
                    : "user",

            parts: [
                {
                    text: content
                }
            ]

        });
    }

    return result;
}


/* =========================
   ARQUIVOS ATUAIS
========================= */

function addCurrentFiles(parts, files) {

    if (!Array.isArray(files)) {
        return;
    }

    for (const file of files) {

        if (!file) {
            continue;
        }


        /* IMAGEM */

        if (
            typeof file.type === "string" &&
            file.type.startsWith("image/") &&
            typeof file.data === "string"
        ) {

            const match =
                file.data.match(
                    /^data:([^;]+);base64,(.+)$/
                );

            if (!match) {
                continue;
            }

            parts.push({

                inlineData: {

                    mimeType: match[1],

                    data: match[2]

                }

            });

            parts.push({

                text:
                    `Analise a imagem "${file.name || "imagem"}".`

            });

            continue;
        }


        /* ARQUIVO DE TEXTO/CODIGO */

        if (typeof file.text === "string") {

            parts.push({

                text:
                    "Arquivo anexado: " +
                    (file.name || "arquivo") +
                    "\n\n" +
                    "Conteudo do arquivo:\n\n" +
                    file.text

            });

        }

    }
}


/* =========================
   CHAT
========================= */

app.post("/api/chat", async (req, res) => {

    try {

        if (!process.env.GEMINI_API_KEY) {

            return res.status(503).json({

                error:
                    "A IA ainda nao esta configurada. Configure GEMINI_API_KEY nas variaveis de ambiente."

            });

        }


        const body =
            req.body || {};


        const messages =
            Array.isArray(body.messages)
                ? body.messages
                : [];


        const currentMessage =
            body.currentMessage || {};


        const contents =
            convertMessages(messages);


        /* =========================
           ADICIONAR ARQUIVOS
        ========================= */

        if (
            Array.isArray(currentMessage.files) &&
            currentMessage.files.length > 0
        ) {

            let lastUser = null;


            for (
                let i = contents.length - 1;
                i >= 0;
                i--
            ) {

                if (
                    contents[i].role === "user"
                ) {

                    lastUser =
                        contents[i];

                    break;
                }
            }


            if (!lastUser) {

                lastUser = {

                    role: "user",

                    parts: []

                };

                contents.push(lastUser);

            }


            addCurrentFiles(

                lastUser.parts,

                currentMessage.files

            );

        }


        /* =========================
           VALIDACAO
        ========================= */

        if (!contents.length) {

            return res.status(400).json({

                error:
                    "Nenhuma mensagem foi enviada."

            });

        }


        /* =========================
           MODELO
        ========================= */

        const model =
            process.env.GEMINI_MODEL ||
            "gemini-3.6-flash";


        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            encodeURIComponent(model) +
            ":generateContent?key=" +
            encodeURIComponent(
                process.env.GEMINI_API_KEY
            );


        /* =========================
           REQUEST GEMINI
        ========================= */

        const response =
            await fetch(

                url,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            systemInstruction: {

                                parts: [

                                    {

                                        text:
                                            SYSTEM

                                    }

                                ]

                            },

                            contents:

                                contents

                        })

                }

            );


        const data =
            await response.json();


        /* =========================
           ERRO GEMINI
        ========================= */

        if (!response.ok) {

            console.error(
                "Erro Gemini:",
                data
            );


            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "Erro na API Gemini."

            });

        }


        /* =========================
           RESPOSTA
        ========================= */

        let reply = "";


        if (

            data &&

            Array.isArray(
                data.candidates
            ) &&

            data.candidates[0] &&

            data.candidates[0].content &&

            Array.isArray(
                data.candidates[0]
                    .content
                    .parts
            )

        ) {

            reply =
                data.candidates[0]
                    .content
                    .parts

                    .map(
                        part =>
                            part.text || ""
                    )

                    .join("");

        }


        if (!reply.trim()) {

            reply =
                "Sem resposta da IA.";

        }


        return res.json({

            reply: reply

        });


    } catch (error) {

        console.error(
            "Erro no backend:",
            error
        );


        return res.status(500).json({

            error:
                "Falha no backend: " +
                (
                    error?.message ||
                    "erro desconhecido"
                )

        });

    }

});


/* =========================
   PORTA
========================= */

const PORT =
    process.env.PORT || 3000;


/*
 * 0.0.0.0 e necessario para
 * hospedagem como Render.
 */

app.listen(

    PORT,

    "0.0.0.0",

    () => {

        console.log(
            "AetherCode AI rodando na porta " +
            PORT
        );

    }

);