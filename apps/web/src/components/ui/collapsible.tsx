'use client';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';

function Collapsible(props: Readonly<CollapsiblePrimitive.Root.Props>) {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger(props: Readonly<CollapsiblePrimitive.Trigger.Props>) {
	return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

function CollapsibleContent(props: Readonly<CollapsiblePrimitive.Panel.Props>) {
	return <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
