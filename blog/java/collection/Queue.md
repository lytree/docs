---
router: blog
title: Queue
date: 2022-10-30T13:22:56Z
lastmod: 2023-05-27T15:51:10Z
---

# Queue

## Queue 	​![image](assets/image-20230527154724-v674duu.png)​

　　**注意：不要把 null 添加到队列中，否则 poll()方法返回 null 时，很难确定是取到了 null 元素还是队列为空。**

## PriorityQueue(优先队列) `extends AbstractQueue`

> 通过二叉小顶堆实现，可以用一棵完全二叉树表示
> 优先队列的作用是能保证每次取出的元素都是队列中权值最小的
> PriorityQueue 实现了 Queue 接口，不允许放入 null 元素；其通过堆实现，具体说是通过完全二叉树 （complete binary tree） 实现的小顶堆（任意一个非叶子节点的权值，都不大于其左右子节点的权值），也就意味着可以通过数组来作为 PriorityQueue 的底层实现
> 放入 PriorityQueue 的元素，必须实现 Comparable 接口，PriorityQueue 会根据元素的排序顺序决定出队的优先级

## Deque `extends Queue`(接口)

　　**队列和 Deque 方法的比较**

|队列方法|等效的 Deque 方法|
| ---------| -----------------|
|add(e)|addLast(e)|
|offer(e)|offerLast(e)|
|remove()|removeFirst()|
|poll()|pollFirst()|
|element()|getFirst()|
|peek()|peekFirst()|

## ArrayDeque `implements Deque` (实现接口)

## ArrayBlockingQueue

## SynchronousQueue

## PriorityBlockingQueue

## DelayQueue
