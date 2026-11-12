// The host of a website for display: lowercase, without a leading `www.`. A missing or unparseable
// address has none.
function getHostname(url?: null | string): string | undefined {
	if (!url || !URL.canParse(url)) {
		return undefined;
	}

	return new URL(url).hostname.toLowerCase().replace(/^www\./u, '');
}

export { getHostname };
