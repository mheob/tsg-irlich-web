import type { Image } from '@sanity/types';
import groq from 'groq';
import { sanityClient } from 'sanity:client';

interface Hero {
	intro: string;
	subtitle: string;
	title: string;
}

export async function getHero() {
	return await sanityClient.fetch<Hero>(groq`*[_type == 'home'][0] { title, subtitle, intro }`);
}

interface FeatureSection {
	features: {
		icon: string;
		intro: string;
		title: string;
	}[];
	intro: string;
	subtitle: string;
	title: string;
}

export async function getFeatureSection() {
	const result = await sanityClient.fetch<{ content: { featureSection: FeatureSection } }>(groq`
		*[_type == 'home'][0] {
			content {
				featureSection {
					title,
					subtitle,
					intro,
					features[] {
						title,
						intro,
						icon,
					}
				}
			}
		}
	`);

	return result.content.featureSection;
}

interface VisionSection {
	cta: string;
	intro: string;
	subtitle: string;
	title: string;
}

export async function getVisionSection() {
	const result = await sanityClient.fetch<{ content: { visionSection: VisionSection } }>(
		groq`*[_type == 'home'][0] { content { visionSection } }`,
	);

	return result.content.visionSection;
}

interface GroupsSection {
	groups: {
		description: string;
		icon: string;
		title: string;
	}[];
	groupsSection: {
		subtitle: string;
		title: string;
	};
}

export async function getGroupsSection() {
	const result = await sanityClient.fetch<{ content: GroupsSection }>(groq`
		*[_type == 'home'][0] {
			content {
				groupsSection,
				'groups': *[_type == 'group'][] {
					title,
					description,
					icon
				}
			}
		}
	`);

	return result.content;
}

interface StatsSection {
	stats: {
		suffix?: string;
		title: string;
		value: number;
	}[];
}

export async function getStatsSection() {
	const result = await sanityClient.fetch<{ content: { statsSection: StatsSection } }>(groq`
		*[_type == 'home'][0] {
			content {
				statsSection {
					stats[] {
						title,
						suffix,
						value,
					}
				}
			}
		}
	`);

	return result.content.statsSection;
}

interface PriceCardContent {
	benefits: string[];
	benefitsTitle: string;
	cta: string;
	intro: string;
	price: number;
	subtitle: string;
	title: string;
}

interface PriceSection {
	pricingAdult: PriceCardContent;
	pricingFamily: PriceCardContent;
	pricingYouth: PriceCardContent;
}

export async function getPriceTableSection() {
	const result = await sanityClient.fetch<{ content: { pricingSection: PriceSection } }>(
		groq`*[_type == 'home'][0] { content { pricingSection } }`,
	);

	return result.content.pricingSection;
}

interface TestimonialSection {
	subtitle: string;
	testimonials: {
		firstName: string;
		image: Image;
		lastName: string;
		quote: string;
		role: string;
		showAlways: boolean;
	}[];
	title: string;
}

export async function getTestimonialSection() {
	const result = await sanityClient.fetch<{
		content: { testimonialSection: TestimonialSection };
	}>(groq`
		*[_type == 'home'][0] {
			content {
				testimonialSection {
					title,
					subtitle,
					testimonials[0..2]-> {
						firstName,
						lastName,
						image,
						quote,
						role,
						showAlways,
					},
				}
			}
		}
	`);

	return result.content.testimonialSection;
}

interface ContactPersonsSection {
	contactPersons: {
		email: string;
		firstName: string;
		image: Image;
		lastName: string;
		phone: string;
		role: string;
		vision: string;
	}[];
	intro: string;
	subtitle: string;
	title: string;
}

export async function getContactPersonsSection() {
	const result = await sanityClient.fetch<{
		content: { contactPersonsSection: ContactPersonsSection };
	}>(groq`
		*[_type == 'home'][0] {
			content {
				contactPersonsSection {
					title,
					intro,
					subtitle,
					contactPersons[]-> {
						firstName,
						lastName,
						email,
						phone,
						image,
						"role": affiliations[department->title == 'Vorstand'][0].role->title,
						"vision": affiliations[department->title == 'Vorstand'][0].description,
					}
				}
			}
		}
	`);

	return result.content.contactPersonsSection;
}

interface NewsSection {
	articles: {
		author: {
			firstName: string;
			image: Image;
			lastName: string;
		};
		categories: {
			slug: string;
			title: string;
		}[];
		excerpt: string;
		featuredImage: Image;
		slug: string;
		title: string;
	}[];
	section: {
		intro: string;
		subtitle: string;
		title: string;
	};
}

export async function getNewsSection() {
	return sanityClient.fetch<NewsSection>(groq`
		{
			"section": *[_type == 'home'][0] {
				"title": content.newsSection.title,
				"subtitle": content.newsSection.subtitle,
				"intro": content.newsSection.intro,
			},
			"articles": *[_type == 'news.article'][0..2] {
				title,
				"slug": slug.current,
				excerpt,
				categories[]->{ title, "slug": slug.current },
				featuredImage,
				author->{ firstName, lastName, image },
				_updatedAt,
			} | order(_updatedAt desc)
		}
	`);
}
