import type { PortableTextBlock } from '@portabletext/types';
import type { ImageAsset, Slug } from '@sanity/types';
import groq from 'groq';
import { sanityClient } from 'sanity:client';

export async function getNewsArticles(): Promise<NewsArticle[]> {
	return await sanityClient.fetch(groq`*[_type == "news.article"] | order(_createdAt desc)`);
}

export async function getNewsArticle(slug: string): Promise<NewsArticle> {
	return await sanityClient.fetch(groq`*[_type == "news.article" && slug.current == $slug][0]`, {
		slug,
	});
}

export interface NewsArticle {
	_createdAt: string;
	_type: 'newsArticle';
	body: PortableTextBlock[];
	excerpt?: string;
	mainImage?: ImageAsset;
	slug: Slug;
	title?: string;
}
