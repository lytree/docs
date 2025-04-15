---
router: blog
title: List
date: 2022-10-30T13:22:01Z
lastmod: 2023-05-27T15:43:26Z
tags: [集合]
---

# List

---

　　**List 集合的三个子类：**

- ArrayList :底层数据结构是数组。线程不安全
- LinkedList :底层数据结构是链表。线程不安全
- Vector:底层数据结构是数组。线程安全

## ArrayList

### 简介

- ArrayList 继承了 AbstractList，实现了 List。它是一个数组队列，提供了相关的添加、删除、修改、遍历等功能。
- ArrayList 实现了 RandomAccess 接口， RandomAccess 是一个标志接口，表明实现这个这个接口的 List 集合是支持快速随机访问的。在 ArrayList 中，我们即可以通过元素的序号快速获取元素对象，这就是快速随机访问。
- ArrayList 实现了 Cloneable 接口，即覆盖了函数 clone()，能被克隆。
- ArrayList 实现 java.io.Serializable 接口，这意味着 ArrayList 支持序列化，能通过序列化去传输。
- 和 Vector 不同，ArrayList 中的操作不是线程安全的！所以，建议在单线程中才使用 ArrayList，而在多线程中可以选择 Vector 或者 CopyOnWriteArrayList。

### System.arraycopy()和 Arrays.copyOf()方法

#### 两者联系与区别

　　**联系：**

　　看两者源代码可以发现 copyOf()内部调用了 System.arraycopy()方法

　　**区别：**

　　arraycopy()需要目标数组，将原数组拷贝到你自己定义的数组里，而且可以选择拷贝的起点和长度以及放入新数组中的位置

　　copyOf()是系统自动在内部新建一个数组，并返回该数组。

　　**注意的是：**

- java 中的 length 属性是针对数组说的,比如说你声明了一个数组,想知道这个数组的长度则用到了 length 这个属性.
- java 中的 length()方法是针对字 符串 String 说的,如果想看这个字符串的长度则用到 length()这个方法.
- java 中的 size()方法是针对泛型集合说的,如果想看这个泛型有多少个元素,就调用此方法来查看!

### 细节

- ArrayList 是基于动态数组实现的，在增删时候，需要数组的拷贝复制。(navite 方法由 C/C++实现)
- ArrayList 的默认初始化容量是 10，每次扩容时候增加原先容量的一半，也就是变为原来的 1.5 倍
- 删除元素时不会减少容量，若希望减少容量则调用 trimToSize()
- 它不是线程安全的。它能存放 null 值。

## LinkedList

### 简介

> 底层实现是双向链表(双向链表方便实现往前遍历)
> LinkedList 是一个实现了 List 接口和 Deque 接口的双端链表。 LinkedList 底层的链表结构使它支持高效的插入和删除操作，另外它实现了 Deque 接口，使得 LinkedList 类也具有队列的特性; LinkedList 不是线程安全的，如果想使 LinkedList 变成线程安全的，可以调用静态类 Collections 类中的 synchronizedList 方法：

## Vector：

- 底层是数组，现在已少用，被 ArrayList 替代，原因有两个：
- Vector 所有方法都是同步，有性能损失。
- Vector 初始 length 是 10 超过 length 时 以 100%比率增长，相比于 ArrayList 更多消耗内存。
- ArrayList 在底层数组不够用时在原来的基础上扩展 0.5 倍，Vector 是扩展 1 倍。

　　**总的来说：查询多用 ArrayList，增删多用 LinkedList。**

　　ArrayList 增删慢不是绝对的(在数量大的情况下，已测试)：

　　如果增加元素一直是使用 add()(增加到末尾)的话，那是 ArrayList 要快

　　一直删除末尾的元素也是 ArrayList 要快【不用复制移动位置】

　　至于如果删除的是中间的位置的话，还是 ArrayList 要快！

## SkipList

## CopyOnWriteArrayList

　　‍

### 适用场景

* **读操作可以尽可能的快，而写即使慢一些也没关系**

　　在很多应用场景中，读操作可能会远远多于写操作。比如，有些系统级别的信息，往往只需要加载或者修改很少的次数，但是会被系统内所有模块频繁的访问。对于这种场景，我们最希望看到的就是读操作可以尽可能的快，而写即使慢一些也没关系。

* **读多写少**

　　黑名单是最典型的场景，假如我们有一个搜索网站，用户在这个网站的搜索框中，输入关键字搜索内容，但是某些关键字不允许被搜索。这些不能被搜索的关键字会被放在一个黑名单中，黑名单并不需要实时更新，可能每天晚上更新一次就可以了。当用户搜索时，会检查当前关键字在不在黑名单中，如果在，则提示不能搜索。这种读多写少的场景也很适合使用 CopyOnWrite 集合。

### 读写规则

* **读写锁的规则**

　　读写锁的思想是：读读共享、其他都互斥（写写互斥、读写互斥、写读互斥），原因是由于读操作不会修改原有的数据，因此并发读并不会有安全问题；而写操作是危险的，所以当写操作发生时，不允许有读操作加入，也不允许第二个写线程加入。

* **对读写锁规则的升级**

　　CopyOnWriteArrayList 的思想比读写锁的思想又更进一步。为了将读取的性能发挥到极致，CopyOnWriteArrayList 读取是完全不用加锁的，更厉害的是，**写入也不会阻塞读取操作，也就是说你可以在写入的同时进行读取**，只有写入和写入之间需要进行同步，也就是不允许多个写入同时发生，但是在写入发生时允许读取同时发生。这样一来，读操作的性能就会大幅度提升。

### 特点

* **CopyOnWrite的含义**

　　从 CopyOnWriteArrayList 的名字就能看出它是满足 CopyOnWrite 的 ArrayList，CopyOnWrite 的意思是说，当容器需要被修改的时候，不直接修改当前容器，而是先将当前容器进行 Copy，复制出一个新的容器，然后修改新的容器，**完成修改之后，再将原容器的引用指向新的容器**。这样就完成了整个修改过程。

　　这样做的好处是，CopyOnWriteArrayList 利用了“不变性”原理，因为容器每次修改都是创建新副本，所以对于旧容器来说，其实是不可变的，也是线程安全的，无需进一步的同步操作。我们可以对 CopyOnWrite 容器进行并发的读，而不需要加锁，因为当前容器不会添加任何元素，也不会有修改。

　　CopyOnWriteArrayList 的所有修改操作（add，set等）都是通过创建底层数组的新副本来实现的，所以 CopyOnWrite 容器也是一种读写分离的思想体现，读和写使用不同的容器。

* **迭代期间允许修改集合内容**

　　ArrayList 在迭代期间如果修改集合的内容，会抛出 ConcurrentModificationException 异常。CopyOnWriteArrayList 的迭代器在迭代的时候，如果数组内容被修改了，CopyOnWriteArrayList 不会报 ConcurrentModificationException 的异常，因为迭代器使用的依然是旧数组，只不过迭代的内容可能已经过时了

### 缺点

　　这些缺点不仅是针对 CopyOnWriteArrayList，其实同样也适用于其他的 CopyOnWrite 容器：

* **内存占用问题**

　　因为 CopyOnWrite 的写时复制机制，所以在进行写操作的时候，内存里会同时驻扎两个对象的内存，这一点会占用额外的内存空间。

* **在元素较多或者复杂的情况下，复制的开销很大**

　　复制过程不仅会占用双倍内存，还需要消耗 CPU 等资源，会降低整体性能。

* **数据一致性问题**

　　由于 CopyOnWrite 容器的修改是先修改副本，所以这次修改对于其他线程来说，并不是实时能看到的，只有在修改完之后才能体现出来。如果你希望写入的的数据马上能被其他线程看到，CopyOnWrite 容器是不适用的。

　　内部使用ReentrantLock 锁，用来保证修改操作的线程安全
