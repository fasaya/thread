'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from "zod"
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "../ui/textarea";
import { usePathname, useRouter } from "next/navigation"

import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.actions";

function PostThread({ userId }: { userId: string }) {

    const router = useRouter()
    const pathname = usePathname()

    const form = useForm({
        resolver: zodResolver(ThreadValidation),
        defaultValues: {
            thread: '',
            accountId: userId
        }
    })

    // 2. Define a submit handler.
    const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.

        await createThread({
            text: values.thread,
            author: userId,
            communityId: null,
            path: pathname
        })

        router.push('/')
    }


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col justify-start gap-10 mt-5"
            >
                <FormField
                    control={form.control}
                    name="thread"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-3 w-full">
                            {/* <FormLabel className="text-base-semibold text-light-2">
                                    Bio
                                </FormLabel> */}
                            <FormControl className="no-focus border-dark-4 bg-dark-3 text-light-1">
                                <Textarea
                                    rows={15}
                                    placeholder="What's on your mind?"
                                    className="account-form_input no-focus"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="bg-primary-500">Post Thread</Button>
            </form>
        </Form>

    )
}

export default PostThread
