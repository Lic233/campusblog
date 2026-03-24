'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { JSONContent } from '@tiptap/core'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconPencil,
  IconPhoto,
} from '@tabler/icons-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { MovingBorderButton } from '@/components/ui/moving-border'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { tiptapExtensions } from '../../lib/tiptap-extensions'
import { TiptapToolbar } from './TiptapToolbar'

type SchoolOption = { id: string | number; name: string; slug: string }
type SubChannelOption = { id: string | number; name: string; slug: string; school: string | number }
type TagOption = { id: string | number; name: string }

type EditorDictionary = {
  editor: {
    pageTitle: string
    titlePlaceholder: string
    contentPlaceholder: string
    excerptLabel: string
    excerptPlaceholder: string
    schoolLabel: string
    schoolPlaceholder: string
    subChannelLabel: string
    subChannelPlaceholder: string
    subChannelNone: string
    tagsLabel: string
    tagsPlaceholder: string
    coverLabel: string
    coverUpload: string
    coverUploading: string
    coverRemove: string
    metaTitle: string
    publish: string
    publishing: string
    publishSuccess: string
    publishError: string
    saveDraft: string
    savingDraft: string
    draftSuccess: string
    draftError: string
    titleRequired: string
    contentRequired: string
    schoolRequired: string
    schoolRequiredDraft: string
    backToHome: string
  }
}

type SubmitAction = 'draft' | 'publish' | null

type InitialPostData = {
  id: string
  title: string
  excerpt: string
  schoolId: string
  subChannelId: string
  tagIds: string[]
  content: JSONContent | null
}

type EditorFormProps = {
  schools: SchoolOption[]
  subChannels: SubChannelOption[]
  tags: TagOption[]
  t: EditorDictionary
  initialPost?: InitialPostData | null
}

function isContentEmpty(json: JSONContent | null): boolean {
  if (!json) return true
  if (!json.content || json.content.length === 0) return true
  return json.content.every(
    (node) => node.type === 'paragraph' && (!node.content || node.content.length === 0),
  )
}

export default function EditorForm({
  schools,
  subChannels,
  tags,
  t,
  initialPost,
}: EditorFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [schoolId, setSchoolId] = useState(initialPost?.schoolId ?? '')
  const [subChannelId, setSubChannelId] = useState(initialPost?.subChannelId ?? '')
  const [selectedTags, setSelectedTags] = useState<string[]>(initialPost?.tagIds ?? [])
  const [editorContent, setEditorContent] = useState<JSONContent | null>(initialPost?.content ?? null)
  const [submitAction, setSubmitAction] = useState<SubmitAction>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const editor = useEditor({
    extensions: [
      ...tiptapExtensions,
      Placeholder.configure({
        placeholder: t.editor.contentPlaceholder,
      }),
    ],
    content: initialPost?.content ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap-editor-focus min-h-[24rem] px-5 py-4 text-base leading-relaxed focus:outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setEditorContent(currentEditor.getJSON())
    },
  })

  const filteredSubChannels = subChannels.filter((channel) => String(channel.school) === String(schoolId))

  const handleSchoolChange = useCallback((value: string) => {
    setSchoolId(value)
    setSubChannelId('')
    setErrors((prev) => ({ ...prev, school: '' }))
  }, [])

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }, [])

  const validatePublish = (): boolean => {
    const nextErrors: Record<string, string> = {}

    if (!title.trim()) nextErrors.title = t.editor.titleRequired
    if (isContentEmpty(editorContent)) nextErrors.content = t.editor.contentRequired
    if (!schoolId) nextErrors.school = t.editor.schoolRequired

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitPost = async (status: 'draft' | 'published') => {
    if (status === 'published' && !validatePublish()) return

    if (status === 'draft' && !schoolId) {
      setErrors((prev) => ({ ...prev, school: t.editor.schoolRequiredDraft }))
      return
    }

    setSubmitAction(status === 'published' ? 'publish' : 'draft')
    setFeedback(null)

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        content: editorContent,
        school: schoolId,
        status,
      }

      if (subChannelId && subChannelId !== '__none__') body.subChannel = subChannelId
      if (excerpt.trim()) body.excerpt = excerpt.trim()
      if (selectedTags.length > 0) body.tags = selectedTags

      const response = await fetch(initialPost ? `/api/posts/${initialPost.id}` : '/api/posts', {
        method: initialPost ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: data.error || (status === 'published' ? t.editor.publishError : t.editor.draftError),
        })
        return
      }

      setFeedback({
        type: 'success',
        message: status === 'published' ? t.editor.publishSuccess : t.editor.draftSuccess,
      })

      setTimeout(() => {
        router.push(status === 'published' ? '/' : '/user/me')
        router.refresh()
      }, 1200)
    } catch {
      setFeedback({
        type: 'error',
        message: status === 'published' ? t.editor.publishError : t.editor.draftError,
      })
    } finally {
      setSubmitAction(null)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-campus-primary/5 bg-white/70 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-foreground/50 transition-colors hover:text-foreground/80 no-underline"
            >
              <IconArrowLeft size={20} />
            </Link>
            <h1 className="font-headline text-xl font-bold text-campus-primary">
              {t.editor.pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {feedback ? (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-label transition-all',
                  feedback.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-red-200 bg-red-50 text-red-700',
                )}
              >
                {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
                {feedback.message}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void submitPost('draft')}
              disabled={submitAction !== null}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-campus-primary/10 bg-white/75 px-5 text-sm font-label font-semibold text-campus-primary transition-all hover:bg-campus-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconCheck size={17} />
              {submitAction === 'draft' ? t.editor.savingDraft : t.editor.saveDraft}
            </button>

            <MovingBorderButton
              onClick={() => void submitPost('published')}
              disabled={submitAction !== null}
              containerClassName="shrink-0"
              className="px-8 font-label font-bold text-base"
            >
              <IconPencil size={18} />
              {submitAction === 'publish' ? t.editor.publishing : t.editor.publish}
            </MovingBorderButton>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-8 lg:flex-row lg:px-10">
        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <input
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setErrors((prev) => ({ ...prev, title: '' }))
              }}
              placeholder={t.editor.titlePlaceholder}
              className={cn(
                'w-full border-0 border-b border-border bg-transparent px-0 py-6 text-center font-headline font-bold outline-none transition-colors placeholder:text-foreground/20 focus:border-campus-primary/30 focus:placeholder:text-transparent',
                errors.title && 'border-red-400',
              )}
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: 1.2 }}
            />
            {errors.title ? <p className="mt-1.5 text-sm font-label text-red-500">{errors.title}</p> : null}
          </div>

          <div
            className={cn(
              'tiptap-editor overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm transition-all',
              errors.content ? 'border-red-400' : 'border-campus-primary/8',
            )}
          >
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
          {errors.content ? <p className="text-sm font-label text-red-500">{errors.content}</p> : null}
        </div>

        <div className="w-full shrink-0 space-y-5 lg:w-80 xl:w-96">
          <Card className="border-campus-primary/8 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline text-lg text-campus-primary">
                {t.editor.metaTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="font-label text-sm text-foreground/70">
                  {t.editor.schoolLabel}
                  <span className="ml-0.5 text-red-400">*</span>
                </Label>
                <Select value={schoolId} onValueChange={handleSchoolChange}>
                  <SelectTrigger className={cn('w-full', errors.school && 'border-red-400')}>
                    <SelectValue placeholder={t.editor.schoolPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={String(school.id)}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.school ? <p className="text-xs font-label text-red-500">{errors.school}</p> : null}
              </div>

              {schoolId && filteredSubChannels.length > 0 ? (
                <div className="space-y-2">
                  <Label className="font-label text-sm text-foreground/70">
                    {t.editor.subChannelLabel}
                  </Label>
                  <Select value={subChannelId} onValueChange={setSubChannelId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.editor.subChannelPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="__none__">{t.editor.subChannelNone}</SelectItem>
                        {filteredSubChannels.map((channel) => (
                          <SelectItem key={channel.id} value={String(channel.id)}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <Separator className="bg-campus-primary/5" />

              <div className="space-y-2">
                <Label className="font-label text-sm text-foreground/70">{t.editor.tagsLabel}</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(String(tag.id))

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(String(tag.id))}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-sm font-label transition-all duration-200',
                          isSelected
                            ? 'bg-campus-primary/10 font-semibold text-campus-primary'
                            : 'border border-border/50 text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground/80',
                        )}
                      >
                        {tag.name}
                      </button>
                    )
                  })}

                  {tags.length === 0 ? (
                    <p className="text-sm font-label text-foreground/30">{t.editor.tagsPlaceholder}</p>
                  ) : null}
                </div>
              </div>

              <Separator className="bg-campus-primary/5" />

              <div className="space-y-2">
                <Label className="font-label text-sm text-foreground/70">{t.editor.excerptLabel}</Label>
                <Textarea
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder={t.editor.excerptPlaceholder}
                  className="resize-none bg-transparent text-sm"
                  rows={3}
                />
              </div>

              <Separator className="bg-campus-primary/5" />

              <div className="space-y-2">
                <Label className="font-label text-sm text-foreground/70">{t.editor.coverLabel}</Label>
                <div className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-campus-primary/10 p-6 transition-all hover:border-campus-primary/20 hover:bg-campus-primary/[0.02]">
                  <IconPhoto size={28} className="text-foreground/20" />
                  <span className="text-sm font-label text-foreground/40">{t.editor.coverUpload}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
