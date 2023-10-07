'use client'

import * as z from "zod"
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Input } from "../ui/input";
import { usePathname, useRouter } from "next/navigation"

import { ReplyValidation } from "@/lib/validations/thread";
import Image from "next/image";
import { addReplyToPost } from "@/lib/actions/thread.actions";
// import { createThread } from "@/lib/actions/thread.actions";

interface Props {
    postId: string;
    currentUserImg: string;
    currentUserId: string
}

function Reply({
    postId,
    currentUserImg,
    currentUserId
}: Props) {

    const pathname = usePathname()

    const form = useForm({
        resolver: zodResolver(ReplyValidation),
        defaultValues: {
            thread: '',
        }
    })

    // 2. Define a submit handler.
    const onSubmit = async (values: z.infer<typeof ReplyValidation>) => {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.

        await addReplyToPost(
            postId,
            values.thread,
            JSON.parse(currentUserId),
            pathname
        )

        form.reset()
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="comment-form"
            >
                <FormField
                    control={form.control}
                    name="thread"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3 w-full">
                            <FormLabel className="text-base-semibold text-light-2">
                                <Image
                                    src={currentUserImg}
                                    alt="Profile image"
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                />
                            </FormLabel>
                            <FormControl className="border-none bg-transparent">
                                <Input
                                    type="text"
                                    placeholder="What's on your mind?"
                                    className="no-focus text-light-1 outline-none"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="comment-form_btn">Reply</Button>
            </form>
        </Form >
    )
}

export default Reply