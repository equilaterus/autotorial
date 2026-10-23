---
title: "JavaScript: Hola mundo"
language: es
objectives:
  - Crear un primer programa de JavaScript
  - Mostrar un mensaje con console.log
  - Ejecutar el archivo y comprobar su salida
prerequisites:
  - Ninguno
---

# JavaScript: Hola mundo

Una introducción breve para escribir, ejecutar y comprobar el primer programa antes de continuar con funciones.

```aitutorial
{
  "scenes": [
    {
      "id": "first-program",
      "type": "concept",
      "title": "Tu primer programa",
      "body": "Un programa es una secuencia de instrucciones. Empezaremos guardando un texto y mostrándolo en la consola.",
      "bullets": ["JavaScript ejecuta instrucciones en orden", "Los textos se escriben entre comillas", "La consola permite observar el resultado"],
      "narration": "Un programa es una secuencia de instrucciones. En nuestro primer ejemplo guardaremos un texto y lo mostraremos en la consola para comprobar el resultado."
    },
    {
      "id": "hello-code",
      "type": "code",
      "title": "Escribir Hola, mundo",
      "language": "javascript",
      "code": "const mensaje = \"Hola, mundo!\";\nconsole.log(mensaje);",
      "reveal": [0, 1],
      "highlights": [1, 2],
      "narration": "La primera línea guarda el texto Hola, mundo en la constante mensaje. La segunda línea usa console punto log para mostrar ese valor."
    },
    {
      "id": "run-program",
      "type": "terminal",
      "title": "Ejecutar y comprobar",
      "command": "node hola.js",
      "output": "Hola, mundo!",
      "narration": "Guardamos el código en hola punto jota ese y lo ejecutamos con Node. La terminal responde Hola, mundo, exactamente como esperábamos."
    }
  ],
  "exercises": [
    {
      "id": "predict-output",
      "type": "output-prediction",
      "afterScene": "hello-code",
      "prompt": "¿Qué texto mostrará console.log(mensaje)?",
      "choices": ["mensaje", "Hola, mundo!", "hola.js"],
      "answer": 1,
      "explanation": "console.log muestra el valor guardado dentro de mensaje, no el nombre de la constante."
    },
    {
      "id": "write-message",
      "type": "code-completion",
      "afterScene": "run-program",
      "prompt": "Cambia mensaje para que el programa muestre exactamente Hola, mundo!",
      "starter": "const mensaje = \"Adiós\";\nconsole.log(mensaje);",
      "solution": "const mensaje = \"Hola, mundo!\";\nconsole.log(mensaje);",
      "tests": [
        {"name":"guarda el saludo completo","expression":"mensaje","expected":"Hola, mundo!"}
      ],
      "explanation": "Una cadena de texto conserva letras, espacios, coma y signo de admiración exactamente como aparecen entre comillas."
    }
  ]
}
```
