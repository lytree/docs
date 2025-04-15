---
router: blog
title: ThreadLocal
date: 2023-05-27T19:29:23Z
lastmod: 2023-05-29T22:47:04Z
tags: [基础]
---

# ThreadLocal

## ThreadLocal

　　ThreadLocal 提供线程局部变量，即为使用相同变量的每一个线程维护一个该变量的副本。当某些数据是以线程为作用域并且不同线程具有不同的数据副本的时候，就可以考虑采用 ThreadLocal，比如数据库连接 Connection，每个请求处理线程都需要，但又不相互影响，就是用 ThreadLocal 实现。

### 为何要Entry使用用弱引用

　　如果使用强引用,情况会如下:

* ThreadLocalMap 作为 Thread 的成员变量,会随 Thread 一直保留。
* ThreadLocalMap 的 key 是 ThreadLocal 对象,如果使用强引用,ThreadLocal 对象会被 ThreadLocalMap 强引用,无法被回收。
* 而 ThreadLocal 对象可能是唯一对某个对象的引用,这会导致这个对象也无法被回收,发生内存泄露。

　　使用弱引用可以避免这种情况:

* 当 ThreadLocal 对象没有其他强引用时,由于 ThreadLocalMap 中的引用是弱引用,ThreadLocal 对象仍然可以被垃圾回收。
* 垃圾回收 ThreadLocal 对象后,ThreadLocalMap 中对应的 Entry 的 key 变为 null。
* 之后 ThreadLocalMap 在执行 get、set、remove 等操作时,会忽略 key 为 null 的 Entry,达到清理作用。
* 这样就避免了 ThreadLocal 对象由于 ThreadLocalMap 的强引用而无法被回收的问题,解决了内存泄露。

### ThreadLocal 内存泄漏条件

　　ThreadLocal被回收&&线程被复用&&线程复用后不再调用ThreadLocal的set/get/remove方法 才可能 发生内存泄露（条件还是相对苛刻）
