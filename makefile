install_runner_aliases:
	for runner in \
		~/code/puller/ensure_puller_running.sh \
		~/code/abacus/ensure_abacus_running.sh  \
		~/code/abacus/ensure_frontend_running.sh \
	; do \
		if [ ! -f /usr/bin/$$runner ]; then \
			echo $$runner ;\
			cp -s $$runner /usr/bin \
		; fi \
	done
