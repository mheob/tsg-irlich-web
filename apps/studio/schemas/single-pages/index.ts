import aboutUsPage from './about-us';
import accessibilityPage from './accessibility';
import contactPage from './contact';
import echoOverviewPage from './echo-overview';
import groupsPage from './groups';
import homePage from './home';
import imprintPage from './imprint';
import membershipPage from './membership';
import newsArticlePage from './news-article';
import newsOverviewPage from './news-overview';
import newsOverviewCategoryPage from './news-overview-category';
import departmentsPage from './offer';
import partnerPage from './partner-page';
import privacyPage from './privacy';
import searchPage from './search-page';
import singleGroupPage from './single-group';
import volunteerPage from './volunteer-page';

/**
 * Every single page: one document per type, opened from the desk by `structure/sections.ts` and
 * placed there by `structure/pages.ts`.
 */
const singlePages = [
	aboutUsPage,
	accessibilityPage,
	contactPage,
	departmentsPage,
	echoOverviewPage,
	groupsPage,
	homePage,
	imprintPage,
	membershipPage,
	newsArticlePage,
	newsOverviewCategoryPage,
	newsOverviewPage,
	partnerPage,
	privacyPage,
	searchPage,
	singleGroupPage,
	volunteerPage,
];

export { singlePages };
