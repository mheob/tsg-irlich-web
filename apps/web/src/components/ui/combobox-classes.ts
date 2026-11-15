/**
 * The classes of the combobox input and its trigger, apart from `combobox.tsx` so that a placeholder
 * can look exactly like the combobox without importing Base UI (WEB-448).
 */
export const COMBOBOX_INPUT_GROUP_CLASS_NAME = 'relative w-full';

export const COMBOBOX_INPUT_CLASS_NAME =
	'flex w-full rounded-md border border-input bg-background-high-contrast py-2 pr-10 pl-4 text-base shadow-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-lg';

export const COMBOBOX_TRIGGER_CLASS_NAME =
	'absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground';
