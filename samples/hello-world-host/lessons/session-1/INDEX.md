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

```autotorial
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
      "nodes": [{"id":"arguments","label":"a = 3, b = 2"},{"id":"function","label":"multiplicar(a, b)"},{"id":"return","label":"6"}],
      "edges": [["arguments","function"],["function","return"]],
      "narration": "Los parámetros a y b reciben dos datos. Return entrega el resultado al lugar donde se llamó la función. Aquí entran tres y dos, y sale seis."
    },
    {
      "id": "implementation",
      "type": "code",
      "title": "Definir y llamar multiplicar",
      "language": "javascript",
      "code": "function multiplicar(a, b) {\n  return a * b;\n}\n\nconsole.log(multiplicar(3, 2));",
      "reveal": [0, 0.5, 1, 1.5, 2],
      "highlights": [1, 2, 5],
      "narration": "Definimos multiplicar con los parámetros a y b. Multiplicamos ambos valores y retornamos el resultado. Para usarla escribimos multiplicar y pasamos tres y dos entre paréntesis."
    },
    {
      "id": "verification",
      "type": "terminal",
      "title": "Comprobar el comportamiento",
      "command": "node multiplicar.js",
      "output": "6",
      "narration": "Al ejecutar el programa, la consola muestra seis. Ahora modifica la función y usa las pruebas para comprobar varios casos, no solamente este ejemplo."
    }
  ],
  "exercises": [
    {
      "id": "return-check",
      "type": "multiple-choice",
      "afterScene": "parameters",
      "prompt": "¿Qué hace return dentro de multiplicar?",
      "choices": ["Repite la función", "Entrega el resultado", "Cambia el parámetro"],
      "answer": 1,
      "explanation": "return termina la ejecución de la función y entrega su valor al código que la llamó."
    },
    {
      "id": "fix-multiplicar",
      "type": "code-completion",
      "afterScene": "verification",
      "prompt": "Corrige multiplicar(a, b) para que devuelva el producto de ambos números.",
      "starter": "function multiplicar(a, b) {\n  return a + b; // modifica esta línea\n}",
      "solution": "function multiplicar(a, b) {\n  return a * b;\n}",
      "tests": [
        {"name":"multiplica 3 por 2","expression":"multiplicar(3, 2)","expected":6},
        {"name":"multiplica por cero","expression":"multiplicar(7, 0)","expected":0},
        {"name":"multiplica un negativo","expression":"multiplicar(-4, 3)","expected":-12}
      ],
      "explanation": "El operador de multiplicación combina los dos parámetros y funciona también con cero y números negativos."
    }
  ]
}
```
