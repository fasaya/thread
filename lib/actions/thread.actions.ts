"use server"

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import User from "../models/user.model";

interface Params {
    text: string;
    author: string;
    communityId: string | null;
    path: string;
}

export async function createThread({
    text, author, communityId, path
}: Params) {
    console.log('path', path);

    try {
        connectToDB();

        const createdThread = await Thread.create({
            text,
            author,
            community: null,
        })

        // update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id },
        });

        revalidatePath(path)

    } catch (error: any) {
        console.error('Failed to create thread', error.message)
    }

}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize

    // fetch posts that have not parents (top level threads)
    const postQuery = Thread
        .find({ parentId: { $in: [null, undefined] } })
        .sort({ createdAt: 'desc' })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ path: 'author', model: User })
        .populate({
            path: 'children',
            populate: {
                path: 'author',
                model: User,
                select: "_id name parentId image"
            }
        })

    const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } })

    const posts = await postQuery.exec()

    const isNext = totalPostsCount > skipAmount + posts.length

    return { posts, isNext }
}


export async function fetchPostById(id: string) {
    try {
        connectToDB();

        // TODO: Populate Community

        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User,
                        select: "_id id name parentId image"
                    },
                    {
                        path: 'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: "_id id name parentId image"
                        }
                    }
                ]
            })
            .exec()

        return thread
    } catch (error: any) {
        throw new Error(`Error fetching thread ${error.message}`)

    }
}

export async function addReplyToPost(
    postId: string,
    commentText: string,
    userId: string,
    path: string
) {
    try {
        connectToDB()

        //  Find original thread by Id
        const originalPost = await Thread.findById(postId)
        if (!originalPost) return null

        const replyPost = new Thread({
            text: commentText,
            author: userId,
            parentId: postId
        })

        const savedReplyPost = await replyPost.save()

        originalPost.children.push(savedReplyPost._id)

        await originalPost.save()

        revalidatePath(path)

    } catch (error: any) {
        throw new Error(`Error reply to thread ${error.message}`)
    }

}
