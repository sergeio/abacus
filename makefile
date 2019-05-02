.PHONY: install_runner_aliases deps_py deps_js deps postgres test clean

install_runner_aliases:
	for runner in \
		~/code/puller/ensure_puller_running.sh \
		~/code/abacus/ensure_abacus_running.sh  \
		~/code/abacus/ensure_all_running.sh \
		~/code/abacus/ensure_frontend_running.sh \
	; do \
		if ! command -v $$(basename $$runner) >/dev/null 2>&1 ; then \
			cp -s $$runner /usr/bin \
		; fi \
	done

venv:
	virtualenv venv

deps_py: venv
	# "Making python dependencies"
	venv/bin/pip install -r requirements.txt

deps_js: frontend/package.json
	# "Making javascript dependencies"
	npm install --prefix ~/code/abacus/frontend

deps: deps_py deps_js

postgres:
	venv/bin/python database.py

clean:
	rm -rf venv/
	rm -rf frontend/node_modules/

test:
	venv/bin/python tests.py
