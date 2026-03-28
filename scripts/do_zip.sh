#!/bin/bash
set -e
echo "Iniciando compresión..."
cd "/Users/pujaltefotografia/Desktop/DESARROLLO APP Y WEB/LANDING PUJALTE BASECODE/my-project"
rm -f subir_a_hostinger_MANUAL.zip
zip -r subir_a_hostinger_MANUAL.zip deploy_manual -x "*.DS_Store*" "*.git*"
echo "FIN COMPRESION"
ls -lh subir_a_hostinger_MANUAL.zip
