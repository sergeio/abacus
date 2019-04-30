install_runner_aliases:
	for runner in \
		~/code/puller/ensure_puller_running.sh \
		~/code/abacus/ensure_abacus_running.sh  \
		~/code/abacus/ensure_frontend_running.sh \
	; do \
		if ! command -v $$(basename $$runner) >/dev/null 2>&1 ; then \
			cp -s $$runner /usr/bin \
		; fi \
	done

test:
	if command -v $$(basename ~/a/watchfiles) ; then \
		echo 'yes'; \
	fi
