SHELL := /bin/bash

IMAGE := texlive/texlive:latest

MAIN := main.tex
BUILD_DIR := build
OUTPUT_DIR := dist
# UTF-8 filename encoded as hex so Windows make/shell never receives Cyrillic.
OUTPUT_NAME_UTF8_HEX := D09BD0B0D0B1D0BED180D0B0D182D0BED180D0BDD0B0D18F20D180D0B0D0B1D0BED182D0B020E284963620D0A1D0BED0BBD0B4D0B0D182D0BAD0B8D0BD20D09D2ED0A12E20D098D0A3352D3131D09C2E706466

DOCKER_WORKDIR := /workspace

DOCKER_RUN := MSYS_NO_PATHCONV=1 docker run --rm \
	-e HOME=/tmp \
	--mount "type=bind,source=$(CURDIR),target=$(DOCKER_WORKDIR)" \
	-w $(DOCKER_WORKDIR) \
	$(IMAGE)

.PHONY: build clean shell

build:
	mkdir -p "$(BUILD_DIR)" "$(OUTPUT_DIR)"
	python scripts/render_diagram_vectors.py
	$(DOCKER_RUN) python3 scripts/render_diagram_pngs.py
	$(DOCKER_RUN) \
		latexmk \
		-lualatex \
		-synctex=1 \
		-interaction=nonstopmode \
		-halt-on-error \
		-outdir=$(BUILD_DIR) \
		$(MAIN)
	$(DOCKER_RUN) python3 -c 'from pathlib import Path; import shutil; shutil.copy2("build/main.pdf", Path("dist") / bytes.fromhex("$(OUTPUT_NAME_UTF8_HEX)").decode("utf-8"))'

clean:
	$(DOCKER_RUN) \
		latexmk \
		-C \
		-outdir=$(BUILD_DIR) \
		$(MAIN)

shell:
	$(DOCKER_RUN) bash
