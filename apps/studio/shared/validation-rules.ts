import type { StringRule } from 'sanity';

interface RuleOptions {
	inputType?: 'array' | 'text';
	message?: string;
	type?: 'error' | 'warning';
}

const defaultRuleOptions: RuleOptions = { inputType: 'text', type: 'error' };

interface BaseRule<Rule> {
	error: (message: string) => Rule;
	warning: (message: string) => Rule;
}

interface RequiredRule<Rule> extends BaseRule<Rule> {
	required: () => Rule;
}

interface ExactLengthRule<Rule> extends BaseRule<Rule>, RequiredRule<Rule> {
	length: (length: number) => Rule;
}

interface MaxLengthRule<Rule> extends BaseRule<Rule> {
	max: (length: number) => Rule;
}

interface MinLengthRule<Rule> extends BaseRule<Rule>, RequiredRule<Rule> {
	min: (length: number) => Rule;
}

function getTextByInputType(inputType: RuleOptions['inputType'], length: number) {
	const arrayOutput = length === 1 ? 'Eintrag' : 'Einträge';
	return inputType === 'array' ? arrayOutput : 'Zeichen';
}

export function getExactLengthRule<Rule extends ExactLengthRule<Rule>>(
	rule: Rule,
	length: number,
	title: string,
	options = { ...defaultRuleOptions, type: 'warning' },
) {
	const validationRule = rule.length(length);
	const itemText = getTextByInputType(options.inputType, length);
	const message = options.message ?? `${title} muss genau ${length} ${itemText} lang sein`;
	return options.type === 'error' ? validationRule.error(message) : validationRule.warning(message);
}

export function getMaxLengthRule<Rule extends MaxLengthRule<Rule>>(
	rule: Rule,
	length: number,
	title: string,
	options = { ...defaultRuleOptions, type: 'warning' },
) {
	const validationRule = rule.max(length);
	const itemText = getTextByInputType(options.inputType, length);
	const message = options.message ?? `${title} sollte maximal ${length} ${itemText} lang sein`;
	return options.type === 'error' ? validationRule.error(message) : validationRule.warning(message);
}

export function getMinLengthRule<Rule extends MinLengthRule<Rule>>(
	rule: Rule,
	length: number,
	title: string,
	options = defaultRuleOptions,
) {
	const validationRule = rule.required().min(length);
	const itemText = getTextByInputType(options.inputType, length);
	const message = options.message ?? `${title} muss mindestens ${length} ${itemText} lang sein`;
	return options.type === 'error' ? validationRule.error(message) : validationRule.warning(message);
}

export function getPhoneFieldRegexRule(rule: StringRule) {
	return rule
		.regex(/^\+\d{2}\s\d{2,5}\s\d+$/)
		.warning('Telefonnummer sollte in der Form +49 123 456789 geschrieben werden');
}

export function getRequiredRule<Rule extends RequiredRule<Rule>>(
	rule: Rule,
	title: string,
	options = defaultRuleOptions,
) {
	const validationRule = rule.required();
	const message = options.message ?? `${title} ist erforderlich`;
	return options.type === 'error' ? validationRule.error(message) : validationRule.warning(message);
}
