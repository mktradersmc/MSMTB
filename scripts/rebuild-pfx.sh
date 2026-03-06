#!/bin/bash

CRT_PATH="server.crt"
KEY_PATH="server.key"
CHAIN_PATH="server-chain.pem"
OUT_PATH="server.pfx"
PASSWORD="cockpit"

echo -e "\e[33mBuilding new Legacy-PFX from raw PEM files using Git Bash OpenSSL...\e[0m"

# Ensure openssl is in the environment
if ! command -v openssl &> /dev/null; then
    echo -e "\e[31mError: openssl not found in Git Bash.\e[0m"
    exit 1
fi

if [ ! -f "$CRT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo -e "\e[31mError: $CRT_PATH or $KEY_PATH not found in the current directory.\e[0m"
    echo -e "\e[33mPlease place the backup files in the certs folder and run the script from there.\e[0m"
    exit 1
fi

# Git for Windows OpenSSL 3.x needs the legacy provider explicitly loaded
# but sometimes it fails if the ddl is missing. In bash, we can use the older cert/key merge.
if [ -f "$CHAIN_PATH" ]; then
    echo -e "\e[36m -> Integrating trust chain from: $CHAIN_PATH\e[0m"
    
    # Use explicit -certfile to provide the chain to OpenSSL.
    # The -name "awesome-cockpit" is cosmetic but standard. 
    openssl pkcs12 -export -out "$OUT_PATH" -inkey "$KEY_PATH" -in "$CRT_PATH" -certfile "$CHAIN_PATH" -passout pass:$PASSWORD -certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES -macalg sha1
else
    echo -e "\e[33m -> WARNING: No chain ($CHAIN_PATH) found. PFX will be built without trust chain.\e[0m"
    openssl pkcs12 -export -out "$OUT_PATH" -inkey "$KEY_PATH" -in "$CRT_PATH" -passout pass:$PASSWORD -certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES -macalg sha1
fi

if [ $? -eq 0 ]; then
    echo -e "\e[32mSUCCESS! A pristine, Node.js compatible file '$OUT_PATH' has been created!\e[0m"
    echo -e "\e[32mYou can now restart PM2.\e[0m"
else
    echo -e "\e[31mOpenSSL failed with exit code $?.\e[0m"
fi
