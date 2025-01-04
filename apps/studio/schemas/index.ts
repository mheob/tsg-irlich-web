import author from './documents/author';
import group from './documents/group';
import honoraryMember from './documents/honorary-member';
import newsArticle from './documents/news.article';
import newsCategory from './documents/news.category';
import person from './documents/person';
import role from './documents/role';
import testimonial from './documents/testimonial';
import venue from './documents/venue';
import columns from './objects/columns';
import contactTo from './objects/contact-to';
import extendedImage from './objects/extended-image';
import externalLink from './objects/external-link';
import imageCard from './objects/image-card';
import internalLink from './objects/internal-link';
import link from './objects/link';
import metFields from './objects/meta';
import simpleBlockContent from './objects/simple-block-content';
import socialFields from './objects/social-fields';
import stats from './objects/stats';
import trainingTime from './objects/training-time';
import blockContent from './sections/block-content';
import blockquote from './sections/blockquote';
import grid from './sections/grid';
import mainImage from './sections/main-image';
import spacer from './sections/spacer';
import aboutUsPage from './single-pages/about-us';
import contactPage from './single-pages/contact';
import groupsPage from './single-pages/groups';
import homePage from './single-pages/home';
import imprintPage from './single-pages/imprint';
import membershipPage from './single-pages/membership';
import newsArticlePage from './single-pages/news-article';
import newsOverviewPage from './single-pages/news-overview';
import newsOverviewCategoryPage from './single-pages/news-overview-category';
import privacyPage from './single-pages/privacy';
import singleGroupPage from './single-pages/single-group';
import siteSettings from './singletons/site-settings';

export const schemaTypes = [
	// Documents
	newsArticle,
	newsCategory,

	author,
	person,
	honoraryMember,
	role,

	group,
	testimonial,
	venue,

	siteSettings,

	// Objects
	columns,
	contactTo,
	extendedImage,
	externalLink,
	imageCard,
	internalLink,
	link,
	metFields,
	simpleBlockContent,
	socialFields,
	stats,
	trainingTime,
	// Sections
	blockContent,
	blockquote,
	grid,
	mainImage,
	spacer,

	// Single Pages
	aboutUsPage,
	contactPage,
	groupsPage,
	homePage,
	imprintPage,
	membershipPage,
	newsArticlePage,
	newsOverviewCategoryPage,
	newsOverviewPage,
	privacyPage,
	singleGroupPage,
];
