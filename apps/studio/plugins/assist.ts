import { assist } from '@sanity/assist';

import newsArticle from '@/schemas/documents/news.article';

export function assistWithPresets() {
	return assist({
		__presets: {
			[newsArticle.name]: {
				fields: [
					{
						instructions: [
							{
								_key: 'preset-instruction-1',
								icon: 'block-content',
								prompt: [
									{
										_key: '86e70087d4d5',
										_type: 'block',
										children: [
											{
												_key: '6b5d5d6a63cf0',
												_type: 'span',
												marks: [],
												text: 'In Anbetracht des Titelentwurfs ',
											},
											{
												_key: '0132742d463b',
												_type: 'sanity.assist.instruction.fieldRef',
												path: 'title',
											},
											{
												_key: 'a02c9ab4eb2d',
												_type: 'span',
												marks: [],
												text: ' eines Blogbeitrags erstellst du einen umfassenden und ansprechenden Beispielinhalt, der sich über die Länge von ein bis zwei A4-Seiten erstreckt. Der Inhalt sollte strukturiert, informativ und auf das im Titel angedeutete Thema zugeschnitten sein, egal ob es sich um Reisen, Softwaretechnik, Mode, Politik oder ein anderes Thema handelt. Der Text wird unter dem Bild angezeigt. ',
											},
											{
												_key: 'f208ef240062',
												_type: 'sanity.assist.instruction.fieldRef',
												path: 'title',
											},
											{
												_key: '8ecfa74a8487',
												_type: 'span',
												marks: [],
												text: ' und muss ihn nicht im Text wiederholen. Der erstellte Text sollte die folgenden Elemente enthalten:',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: 'e4dded41ea89',
										_type: 'block',
										children: [
											{
												_key: 'cc5ef44a2fb5',
												_type: 'span',
												marks: [],
												text: '1. Einleitung: Ein kurzer Absatz, der das Wesentliche des Blogbeitrags auf den Punkt bringt, den Leser mit spannenden Erkenntnissen fesselt und den Zweck des Beitrags umreißt.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: '585e8de2fe35',
										_type: 'block',
										children: [
											{
												_key: 'fab36eb7c541',
												_type: 'span',
												marks: [],
												text: '2. Main Body:',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: 'e96b89ef6357',
										_type: 'block',
										children: [
											{
												_key: 'b685a310a0ff',
												_type: 'span',
												marks: [],
												text: '- Um die thematische Konsistenz zu gewährleisten, solltest du den Text in mehrere Abschnitte mit Zwischenüberschriften unterteilen, die verschiedene Facetten des Themas behandeln.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: 'ce4acdb00da9',
										_type: 'block',
										children: [
											{
												_key: 'c7468d106c91',
												_type: 'span',
												marks: [],
												text: '- Füge ansprechende und informative Inhalte ein, wie z.B. persönliche Anekdoten (für Reise- oder Modeblogs), technische Erklärungen oder Anleitungen (für Software-Engineering-Blogs), satirische oder humorvolle Beobachtungen (für Shitposting) oder gut begründete Positionen (für politische Blogs).',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: 'fb4572e65833',
										_type: 'block',
										children: [
											{
												_key: '5358f261dce4',
												_type: 'span',
												marks: [],
												text: '- ',
											},
											{
												_key: '50792c6d0f77',
												_type: 'span',
												marks: [],
												text: ' Beobachtungen (für Shitposting) oder gut begründete Positionen (für politische Blogs).',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: '9364b67074ce',
										_type: 'block',
										children: [
											{
												_key: '3b891d8c1dde0',
												_type: 'span',
												marks: [],
												text: 'Wenn möglich, verwende Aufzählungspunkte oder nummerierte Listen, um komplexe Informationen, Prozessschritte oder wichtige Highlights aufzuschlüsseln.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: 'a6ba7579cd66',
										_type: 'block',
										children: [
											{
												_key: '1280f11d499d',
												_type: 'span',
												marks: [],
												text: '3. Schlussfolgerung: Fasse die wichtigsten Punkte zusammen, die in dem Beitrag besprochen wurden, gib abschließende Gedanken oder Handlungsaufforderungen an und lade die Leser/innen ein, sich durch Kommentare oder das Teilen in den sozialen Medien mit dem Inhalt zu beschäftigen.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: '719a79eb4c1c',
										_type: 'block',
										children: [
											{
												_key: 'f1512086bab6',
												_type: 'span',
												marks: [],
												text: '4. Aufforderungen zur Beteiligung: Schließe mit Fragen oder Aufforderungen ab, die die Leser/innen dazu ermutigen, ihre Erfahrungen, Meinungen oder Fragen zum Thema des Blogposts mitzuteilen, aber denke daran, dass es unter dem Blogpost kein Kommentarfeld gibt.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: '4a1c586fd44a',
										_type: 'block',
										children: [
											{
												_key: '697bbd03cb110',
												_type: 'span',
												marks: [],
												text: 'Achte darauf, dass der erstellte Inhalt ein Gleichgewicht zwischen informativ und unterhaltsam ist, um das Interesse eines breiten Publikums zu wecken. Der Beispielinhalt sollte als solide Grundlage dienen, die vom Blogautor weiter angepasst oder erweitert werden kann, um den Beitrag fertigzustellen.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
									{
										_key: 'b072b3c62c3c',
										_type: 'block',
										children: [
											{
												_key: 'd20bb9a03b0d',
												_type: 'span',
												marks: [],
												text: 'Setze nicht jedem Abschnitt "Einleitung", "Hauptteil", "Schluss" oder "Engagement Prompts" voran.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
								],
								title: 'Beispielinhalte generieren',
							},
						],
						/**
						 * Creates Portable Text `content` blocks from the `title` field
						 */
						path: 'content',
					},
					{
						instructions: [
							{
								_key: 'preset-instruction-2',
								icon: 'blockquote',
								prompt: [
									{
										_key: '392c618784b0',
										_type: 'block',
										children: [
											{
												_key: '650a0dcc327d',
												_type: 'span',
												marks: [],
												text: 'Erstelle einen kurzen Auszug auf der Grundlage von ',
											},
											{
												_key: 'c62d14c73496',
												_type: 'sanity.assist.instruction.fieldRef',
												path: 'content',
											},
											{
												_key: '38e043efa606',
												_type: 'span',
												marks: [],
												text: ' das nicht wiederholt, was bereits in der ',
											},
											{
												_key: '445e62dda246',
												_type: 'sanity.assist.instruction.fieldRef',
												path: 'title',
											},
											{
												_key: '98cce773915e',
												_type: 'span',
												marks: [],
												text: '. Bedenke, dass die Benutzeroberfläche nur einen begrenzten horizontalen Platz hat, und versuche, zu viele Zeilenumbrüche zu vermeiden und den Text so kurz, prägnant und knapp wie möglich zu halten. Im besten Fall ein Satz, höchstens zwei Sätze.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
								],
								title: 'Inhalt zusammenfassen',
							},
						],
						/**
						 * Summarize content into the `excerpt` field
						 */
						path: 'excerpt',
					},
				],
			},
		},
	});
}
