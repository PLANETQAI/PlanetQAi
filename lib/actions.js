'use server'

import { revalidateTag } from 'next/cache'

export default async function reload(path) {
	revalidateTag(path)
}
