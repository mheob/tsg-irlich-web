import type { StringRule } from 'sanity';

interface RuleOptions {
	message?: string;
	type?: 'error' | 'warning';
}

const defaultRuleOptions: RuleOptions = { type: 'error' };

interface BaseRule<Rule> {
	error: (message: string) => Rule;
	warning: (message: string) => Rule;
}

interface RequiredRule<Rule> extends BaseRule<Rule> {
	required: () => Rule;
}

interface MaxLengthRule<Rule> extends BaseRule<Rule> {
	max: (length: number) => Rule;
}

interface MinLengthRule<Rule> extends BaseRule<Rule> {
	min: (length: number) => Rule;
	required: () => Rule;
}

export function getMaxLengthRule<Rule extends MaxLengthRule<Rule>>(
	rule: Rule,
	length: number,
	title: string,
	options = { ...defaultRuleOptions, type: 'warning' },
) {
	const validationRule = rule.max(length);
	const message = options.message ?? `${title} sollte maximal ${length} Zeichen lang sein`;
	return options.type === 'error' ? validationRule.error(message) : validationRule.warning(message);
}

export function getMinLengthRule<Rule extends MinLengthRule<Rule>>(
	rule: Rule,
	length: number,
	title: string,
	options = defaultRuleOptions,
) {
	const validationRule = rule.required().min(length);
	const message = options.message ?? `${title} muss mindestens ${length} Zeichen lang sein`;
	return options.type === 'error' ? validationRule.error(message) : validationRule.warning(message);
}

export function getPhoneFieldRegexRule(rule: StringRule) {
	return rule
		.regex(/^\+\d{2}\s\d{2,5}\s\d+$/)
		.warning('Telefonnummer sollte in der Form +49 123 456789 geschrieben werden');
}

export function getRequiredRole<Rule extends RequiredRule<Rule>>(
	rule: Rule,
	title: string,
	options = defaultRuleOptions,
) {
	const validationRule = rule.required();
	const message = options.message ?? `${title} ist erforderlich`;
	return options.type === 'error' ? validationRule.error(message) : validationRule.warning(message);
}
