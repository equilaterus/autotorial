# Voz verificada

La voz abierta que funcionó para las sesiones publicadas fue **Piper 1.8.0**
con el modelo en español mexicano **`es_MX-claude-high`**. Esta es la
configuración usada para generar los tres segmentos de `session-0`; no se usó
espeak para la versión publicada.

## Instalación reproducible

Piper y su modelo deben vivir fuera de `bin/`, porque `bin/` es el snapshot
descartable que se publica en GitHub Pages. Por ejemplo:

```bash
python3 -m venv /tmp/autotorial-piper
/tmp/autotorial-piper/bin/python -m pip install 'piper-tts==1.8.0'
mkdir -p /tmp/autotorial-piper/voices
/tmp/autotorial-piper/bin/python -m piper.download_voices \
  --download-dir /tmp/autotorial-piper/voices \
  es_MX-claude-high
```

La descarga crea estos dos archivos y ambos deben permanecer juntos:

```text
es_MX-claude-high.onnx
es_MX-claude-high.onnx.json
```

## Producción

```bash
PIPER_BIN=/tmp/autotorial-piper/bin/piper \
PIPER_MODEL=/tmp/autotorial-piper/voices/es_MX-claude-high.onnx \
  .autotorial/autotorial produce session-0 --voice piper
```

Para producir otra sesión, cambia únicamente el slug final. La ruta del modelo
forma parte de la clave de caché; conviene elegir una ubicación estable si se
quiere reutilizar el audio entre ejecuciones. `/tmp` fue útil para la prueba
confirmada, pero una carpeta persistente fuera del repositorio es mejor para el
trabajo habitual.

Una ejecución correcta informa explícitamente el proveedor:

```text
✓ narration: piper, 3 generated, 0 cached
```
