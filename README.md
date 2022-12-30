# Nexrender Server(less)

Re-implementation of Nexrender Server using Cloudflare Workers with Durable Objects.

## Differences
This implmentation is fully compatible with the rest of Nexrender's tooling so it will work out of the box with `@nexrender/worker` and `@nexrender/api`. There are however some minor differences and additional implementations that does not exist in Nexrender Server.

* There is no CLI for this since it is meant to be deployed on Cloudflare Workers. As a consequence, there is no CLI command to clean up the database. To replace this functionality, a clean up step will be run at a defined interval with the `CLEANUP_INTERVAL` environment variable instead.