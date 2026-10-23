---
title: Funciones en JavaScript
language: es
objectives:
  - Explicar qué es una función
  - Usar parámetros y return
  - Invocar y modificar una función con pruebas
prerequisites:
  - Expresiones y variables básicas de JavaScript
---

# Funciones en JavaScript

Una sesión corta para aprender a encapsular comportamiento y comprobarlo de forma determinista.

```aitutorial
{
  "scenes": [
    {
      "id": "definition",
      "type": "concept",
      "title": "Una función guarda una acción",
      "body": "Una función es un bloque reutilizable de código. Podemos darle un nombre y ejecutarla cuantas veces necesitemos.",
      "bullets": ["Evita repetir código", "Expresa una intención", "Puede recibir y devolver valores"],
      "narration": "Una función es un bloque reutilizable de código. Le damos un nombre para poder ejecutar la misma acción cada vez que la necesitemos."
    },
    {
      "id": "parameters",
      "type": "diagram",
      "title": "El dato entra, el resultado sale",
      "nodes": [{"id":"argument","label":"3"},{"id":"function","label":"double(n)"},{"id":"return","label":"6"}],
      "edges": [["argument","function"],["function","return"]],
      "narration": "El parámetro ene recibe un dato. Return entrega el resultado al lugar donde se llamó la función. Aquí entra tres y sale seis."
    },
    {
      "id": "implementation",
      "type": "code",
      "title": "Definir y llamar double",
      "language": "javascript",
      "code": "function double(n) {\n  return n * 2;\n}\n\nconsole.log(double(3));",
      "reveal": [0, 0.5, 1, 1.5, 2],
      "highlights": [1, 2, 5],
      "narration": "Definimos double con el parámetro ene. Multiplicamos ene por dos y retornamos el valor. Para usarla escribimos double, abrimos paréntesis y pasamos tres."
    },
    {
      "id": "verification",
      "type": "terminal",
      "title": "Comprobar el comportamiento",
      "command": "node double.js",
      "output": "6",
      "narration": "Al ejecutar el programa, la consola muestra seis. Ahora modifica la función y usa las pruebas para comprobar varios casos, no solamente este ejemplo."
    }
  ],
  "exercises": [
    {
      "id": "return-check",
      "type": "multiple-choice",
      "afterScene": "parameters",
      "prompt": "¿Qué hace return dentro de double?",
      "choices": ["Repite la función", "Entrega el resultado", "Cambia el parámetro"],
      "answer": 1,
      "explanation": "return termina la ejecución de la función y entrega su valor al código que la llamó."
    },
    {
      "id": "fix-double",
      "type": "code-completion",
      "afterScene": "verification",
      "prompt": "Corrige double(n) para que devuelva el doble de cualquier número.",
      "starter": "function double(n) {\n  return n; // modifica esta línea\n}",
      "solution": "function double(n) {\n  return n * 2;\n}",
      "tests": [
        {"name":"duplica 3","expression":"double(3)","expected":6},
        {"name":"duplica 0","expression":"double(0)","expected":0},
        {"name":"duplica un negativo","expression":"double(-4)","expected":-8}
      ],
      "explanation": "Multiplicar el parámetro por dos funciona también con cero y números negativos."
    }
  ]
}
```
