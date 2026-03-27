import { slugField, type FieldHook, type RowField, type TextField } from 'payload'
import slugify from 'slugify'
import { transliterate } from 'transliteration'

type SlugLookup = (candidate: string) => Promise<number | string | null>

type EnsureUniqueSlugArgs = {
  currentDocumentID?: number | string | null
  lookup: SlugLookup
  slug?: string | null
}

const SLUG_FIELD_NAME = 'slug'

const toComparableID = (value: unknown): string | null => {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  return null
}

const createBaseSlug = (value: string): string | undefined => {
  const directSlug = slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  })

  if (directSlug) return directSlug

  const transliterated = transliterate(value).trim()
  if (!transliterated) return undefined

  const transliteratedSlug = slugify(transliterated, {
    lower: true,
    strict: true,
    trim: true,
  })

  return transliteratedSlug || undefined
}

export const formatSlugValue = (valueToSlugify: unknown): string | undefined => {
  if (typeof valueToSlugify !== 'string') return undefined

  const value = valueToSlugify.trim()
  if (!value) return undefined

  return createBaseSlug(value)
}

export const ensureUniqueSlug = async ({
  currentDocumentID,
  lookup,
  slug,
}: EnsureUniqueSlugArgs): Promise<string | undefined> => {
  if (!slug) return undefined

  const currentID = toComparableID(currentDocumentID)

  let suffix = 1
  let candidate = slug

  while (true) {
    const matchingDocumentID = await lookup(candidate)

    if (!matchingDocumentID || toComparableID(matchingDocumentID) === currentID) {
      return candidate
    }

    suffix += 1
    candidate = `${slug}-${suffix}`
  }
}

const findDocumentIDBySlug = async ({
  collectionSlug,
  req,
  slug,
}: {
  collectionSlug: string
  req: Parameters<FieldHook>[0]['req']
  slug: string
}): Promise<number | string | null> => {
  const result = await req.payload.find({
    collection: collectionSlug as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const existingDocument = result.docs[0] as { id?: number | string | null } | undefined

  return existingDocument?.id ?? null
}

const ensureUniqueSlugHook: FieldHook = async ({ collection, originalDoc, req, value }) => {
  if (typeof collection?.slug !== 'string') return value

  const formattedSlug = formatSlugValue(value)
  if (!formattedSlug) return formattedSlug

  return ensureUniqueSlug({
    currentDocumentID: originalDoc?.id,
    lookup: async (candidate) =>
      findDocumentIDBySlug({
        collectionSlug: collection.slug,
        req,
        slug: candidate,
      }),
    slug: formattedSlug,
  })
}

const withUniqueSlugHook = (field: RowField): RowField => {
  const slugTextField = field.fields.find(
    (childField): childField is TextField =>
      childField.type === 'text' && childField.name === SLUG_FIELD_NAME,
  )

  if (!slugTextField) {
    return field
  }

  slugTextField.hooks = {
    ...slugTextField.hooks,
    beforeChange: [...(slugTextField.hooks?.beforeChange ?? []), ensureUniqueSlugHook],
  }

  return field
}

export const buildSlugField = (useAsSlug: string): RowField =>
  slugField({
    overrides: withUniqueSlugHook,
    useAsSlug,
    slugify: ({ valueToSlugify }) => formatSlugValue(valueToSlugify),
  })
