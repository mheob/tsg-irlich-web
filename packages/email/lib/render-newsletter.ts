import { render } from 'react-email';

import { NewsletterEmail } from '../emails/newsletter';
import { toCleverReachTemplate } from './cleverreach-markers';

type NewsletterProps = Parameters<typeof NewsletterEmail>[number];

// Finished mailing HTML without any CleverReach editor markup. Use this when the content
// comes from our own data and only needs to be sent.
export async function renderNewsletterHtml(props: NewsletterProps = {}): Promise<string> {
	return render(NewsletterEmail({ ...props, isTemplate: false }));
}

// HTML for import as a CleverReach template: editable regions, replaceable images and
// duplicatable loop items are marked up with CleverReach template comments.
export async function renderNewsletterTemplate(props: NewsletterProps = {}): Promise<string> {
	return toCleverReachTemplate(await render(NewsletterEmail({ ...props, isTemplate: true })));
}

export { NewsletterEmail } from '../emails/newsletter';
export { stripCleverReachMarkers, toCleverReachTemplate } from './cleverreach-markers';
