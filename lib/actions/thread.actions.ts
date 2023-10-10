"use server"

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";

interface Params {
    text: string;
    author: string;
    communityId: string | null;
    path: string;
}

export async function createThread({
    text, author, communityId, path
}: Params) {

    try {
        connectToDB();

        const communityIdObject = await Community.findOne(
            { id: communityId },
            { _id: 1 }
        );
        console.log('communityIdObject', communityIdObject);

        const createdThread = await Thread.create({
            text,
            author,
            community: communityIdObject,
        })

        // update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id },
        });

        if (communityIdObject) {
            // Update Community model
            await Community.findByIdAndUpdate(communityIdObject, {
                $push: { threads: createdThread._id },
            });
        }

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
        .populate({
            path: "community",
            model: Community,
            select: "_id id name image",
        })

    const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } })

    const posts = await postQuery.exec()

    const isNext = totalPostsCount > skipAmount + posts.length

    return { posts, isNext }
}

export async function fetchPostById(id: string) {
    try {
        connectToDB();

        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: "community",
                model: Community,
                select: "_id id name image",
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

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
    const childThreads = await Thread.find({ parentId: threadId });

    const descendantThreads = [];
    for (const childThread of childThreads) {
        const descendants = await fetchAllChildThreads(childThread._id);
        descendantThreads.push(childThread, ...descendants);
    }

    return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
    try {
        connectToDB();

        // Find the thread to be deleted (the main thread)
        const mainThread = await Thread.findById(id).populate("author community");

        if (!mainThread) {
            throw new Error("Thread not found");
        }

        // Fetch all child threads and their descendants recursively
        const descendantThreads = await fetchAllChildThreads(id);

        // Get all descendant thread IDs including the main thread ID and child thread IDs
        const descendantThreadIds = [
            id,
            ...descendantThreads.map((thread) => thread._id),
        ];

        // Extract the authorIds and communityIds to update User and Community models respectively
        const uniqueAuthorIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
                mainThread.author?._id?.toString(),
            ].filter((id) => id !== undefined)
        );

        const uniqueCommunityIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
                mainThread.community?._id?.toString(),
            ].filter((id) => id !== undefined)
        );

        // Recursively delete child threads and their descendants
        await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

        // Update User model
        await User.updateMany(
            { _id: { $in: Array.from(uniqueAuthorIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );

        // Update Community model
        await Community.updateMany(
            { _id: { $in: Array.from(uniqueCommunityIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to delete thread: ${error.message}`);
    }
}