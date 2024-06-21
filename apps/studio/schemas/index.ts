import author from './documents/author';
import group from './documents/group';
import newsArticle from './documents/news.article';
import newsCategory from './documents/news.category';
import person from './documents/person';
import testimonial from './documents/testimonial';
import columns from './objects/columns';
import contactTo from './objects/contact-to';
import extendedImage from './objects/extended-image';
import externalLink from './objects/external-link';
import internalLink from './objects/internal-link';
import link from './objects/link';
import metFields from './objects/meta';
import simpleBlockContent from './objects/simple-block-content';
import socialFields from './objects/social-fields';
import stats from './objects/stats';
import blockContent from './sections/block-content';
import grid from './sections/grid';
import mainImage from './sections/main-image';
import spacer from './sections/spacer';
import contactPage from './single-pages/contact';
import groupsPage from './single-pages/groups';
import homePage from './single-pages/home';
import imprintPage from './single-pages/imprint';
import membershipPage from './single-pages/membership';
import newsArticlePage from './single-pages/news-article';
import newsOverviewPage from './single-pages/news-overview';
import privacyPage from './single-pages/privacy';
import siteSettings from './singletons/site-settings';

export const schemaTypes = [
	// Documents
	newsArticle,
	newsCategory,

	author,
	person,

	group,
	testimonial,

	siteSettings,

	// Objects
	columns,
	contactTo,
	extendedImage,
	externalLink,
	internalLink,
	link,
	metFields,
	simpleBlockContent,
	socialFields,
	stats,

	// Sections
	blockContent,
	grid,
	mainImage,
	spacer,

	// Single Pages
	contactPage,
	groupsPage,
	homePage,
	imprintPage,
	membershipPage,
	newsArticlePage,
	newsOverviewPage,
	privacyPage,
];
