export function normalizeValue(value) {
	if (!value || value === 'null' || value === 'undefined') {
		return null
	}
	return value
}
