/**
 * Creates the published registration form the end-to-end suite renders at
 * `/anmeldung/e2e-anmeldung` (`apps/web/e2e/specs/registration-form.spec.ts`):
 *
 * ```bash
 * pnpm --filter studio exec sanity exec scripts/create-e2e-form.ts --with-user-token -- --dataset development
 * ```
 *
 * `pnpm run db:sync` replaces `development` with a copy of `production`, which has no such form, so
 * run this again after every sync and before re-recording the fixtures (`pnpm --filter web run
 * e2e:record`). The form is replaced as a whole, so a second run changes nothing.
 */
import process from 'node:process';

import { getCliClient } from 'sanity/cli';

import { E2E_FORM, readDataset } from './create-e2e-form/e2e-form';

const API_VERSION = '2026-10-01';

const dataset = readDataset(process.argv.slice(2));
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({ dataset, useCdn: false });
const form = await client.createOrReplace(E2E_FORM);

console.log(
	`Projekt ${client.config().projectId}, Dataset ${dataset}: Formular ${form._id} geschrieben (Revision ${form._rev}).`,
);
