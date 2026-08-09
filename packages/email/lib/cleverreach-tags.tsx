import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { marker } from './cleverreach-markers';

// Off by default so the preview server and finished mailings stay free of markers.
const TemplateModeContext = createContext(false);

interface CrHtmlProps {
	children: ReactNode;
	mode?: 'default' | 'full' | 'link' | 'safelink' | 'textonly';
}

interface CrImageProps {
	align?: 'center' | 'left' | 'right';
	children: ReactNode;
}

interface CrLoopProps {
	children: ReactNode;
}

interface CrLoopItemProps {
	children: ReactNode;
	name: string;
}

interface TemplateModeProviderProps {
	children: ReactNode;
	isTemplate: boolean;
}

// Enables the CleverReach markers for everything rendered inside it.
export function TemplateModeProvider({
	children,
	isTemplate,
}: Readonly<TemplateModeProviderProps>) {
	return <TemplateModeContext value={isTemplate}>{children}</TemplateModeContext>;
}

// Makes text editable in the CleverReach editor. `default` allows formatting, links and
// placeholders, `textonly` only placeholders, `link` only link settings.
export function CrHtml({ children, mode = 'default' }: Readonly<CrHtmlProps>): ReactNode {
	if (!useContext(TemplateModeContext)) return children;

	return (
		<>
			{marker('html', { mode })}
			{children}
			{marker('/html')}
		</>
	);
}

// Makes an image replaceable in the CleverReach editor.
export function CrImage({ align = 'center', children }: Readonly<CrImageProps>): ReactNode {
	if (!useContext(TemplateModeContext)) return children;

	return (
		<>
			{marker('image', { align })}
			{children}
			{marker('/image')}
		</>
	);
}

// A region whose items the editor can duplicate, reorder and remove. Must not be placed
// between `<table>` and `<tr>` — only around complete tables.
export function CrLoop({ children }: Readonly<CrLoopProps>): ReactNode {
	if (!useContext(TemplateModeContext)) return children;

	return (
		<>
			{marker('loop')}
			{children}
			{marker('/loop')}
		</>
	);
}

// One duplicatable unit inside a `CrLoop`. `name` makes it droppable from the sidebar.
export function CrLoopItem({ children, name }: Readonly<CrLoopItemProps>): ReactNode {
	if (!useContext(TemplateModeContext)) return children;

	return (
		<>
			{marker('loopitem', { name })}
			{children}
			{marker('/loopitem')}
		</>
	);
}
