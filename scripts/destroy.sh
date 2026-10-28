#!/usr/bin/env bash
# Deletes the whole resource group: every environment and the shared plan.
set -euo pipefail

RG="${FAST_GRC_RG:-fast-grc-rg}"

read -r -p "Delete resource group $RG and everything in it? Type the name to confirm: " answer
[[ "$answer" == "$RG" ]] || { echo "Cancelled."; exit 1; }

az group delete -n "$RG" --yes
echo "Deleted $RG."
