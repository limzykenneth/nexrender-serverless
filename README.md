# Nexrender Server(less)

Re-implementation of [Nexrender Server](https://github.com/inlife/nexrender/tree/master/packages/nexrender-server) using Cloudflare Workers with Durable Objects.

## Usage
```
wrangler generate my-app https://github.com/limzykenneth/nexrender-serverless
```

(More info to be added in the future. At this point you should only use this if you are somewhat familiar with Cloudflare Workers.)

## Differences
This implmentation is fully compatible with the rest of Nexrender's tooling so it will work out of the box with `@nexrender/worker` and `@nexrender/api`. There are however some minor differences and [additional implementations](#optional-features) that does not exist in Nexrender Server.

* There is no CLI for this since it is meant to be deployed on Cloudflare Workers. As a consequence, there is no CLI command to clean up the database. To replace this functionality, a clean up step will be run at a defined interval with the `CLEANUP_INTERVAL` (in milisecond) environment variable instead.
* The `NEXRENDER_SECRET` environment variable is used instead of the command line `--secret` option. It is recommended to implement this as a secret value using [worker secret](https://developers.cloudflare.com/workers/wrangler/commands/#secret).
* Network and database/job list file configuration are not applicable.
* *(Not yet implemented)* `NEXRENDER_ORDERING`

If you found any differences in terms of API behaviour between this and Nexrender Server not noted above, please open an issue.

## Optional Features
The following features are not enabled by default but can be enabled with the relevant configuration in [`wrangler.toml`](./wranger.toml).

### Public key based JWT authorization
By setting the `NEXRENDER_PUBLIC_KEY` environment variable it will enable public key based JWT authorization for the server. The public key should be a string in [PEM format](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail) and the key pair should be using RS256 algorithm (other algorithms may be supported in the future).

Once the key is set, you can generate a JWT token signed with the private key and attach it to every request to the server using the `Authorization` header with the `Bearer` scheme.

Additional checks on the payload or other JWT fields can be done by editing [`src/authorization.ts`](./src/authorization.ts) file which have a function `default` under the exported `authorization` object. This function takes in the parsed payload and JWT header that you can check and return true if access should be granted and false if it should be rejected. For users of [multi-tenant mode](#multi-tenant-mode) each key in the `authorization` correspond to the name of each tenant you have so each tenant can have different payload/header checks. If you do not implement a check function for your tenant, the payload/header check will be skipped and authorization just rely on having a valid signed JWT.

This authorization method can be used in conjuction with the `nexrender-secret` header if desired. Only one of the two authorization method need to pass for the client to be authorized, if both are provided by the client.

### Multi-tenant mode
Due to the way Durable Objects work in Cloudflare Workers, it is relatively easy to have multiple separate instances of the API running as if running multiple instances of Nexrender Server each serving a different set of clients and using its own database keeping track of renders.

This is useful if you are planning to logically separate instances of render queues to be served by different set of render workers.

To enable multi-tenant mode, you will need to use Cloudflare D1 database (which is still currently in Alpha and so should not be considered production ready). In [`wrangler.toml`](./wranger.toml) uncomment the `[[ d1_databases ]]` configuration block and follow instruction [here](https://developers.cloudflare.com:2096/d1/get-started/#3-create-your-database) to create your database. Once created you will be given the database uuid, insert that value into the `database_id` field.

Next you will need to create a table with the right schema using the following command:
```sql
DROP TABLE IF EXISTS Tenants;
CREATE TABLE Tenants (
	ObjectID TEXT UNIQUE,
	Name TEXT NOT NULL UNIQUE,
	Secret TEXT,
	PublicKey TEXT,
	PRIMARY KEY (`ObjectID`,`Name`)
);
```

Once these are done, your worker should run without issue.

Without enabling multi-tenant mode, Nexrender Serverless is running a single tenant named `default`. `default` is a special tenant that will read its secret and/or public key value from the environment variables first then if a database entry exist will read there next.

To create a new tenant, you will need to insert a row into the `Tenants` table created above.
* The `Name` field is the only mandatory field
* The `ObjectID` field is populated by the worker so you should leave it blank
* The `Secret` field is the secret value used to compare against `nexrender-secret` header
* The `PublicKey` field is the PEM format public key string used for JWT verification

The `Secret` and `PublicKey` fields can be left empty to not use either or both of the authorization method.

```sql
INSERT INTO Tenants (Name, Secret) VALUES ('custom-tenant', 'secret-string');
```

After creating the new tenant row, you can start making request to the tenant by including in the request header `nexrender-tenant: TENANT_NAME`. Requests made with this header will be looked up in the database and if a corresponding entry is not found, an error will be returned. If an entry is found, its relevant authorization values (if any) will be set and it will now behave in the same way as a regular Nexrender Server.

By default you don't need to include the `default` tenant in the database but if you wish to use the database to store the secret or public key string instead of using evironment secret, you can create an entry with the `Name` field set to `default`.