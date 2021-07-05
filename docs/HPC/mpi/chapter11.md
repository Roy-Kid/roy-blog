---
title: 第十一章- Jacobi迭代的捆绑发送接收实现
date: 2021-06-03
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

在上面的Jacobi迭代这一例子中, 每一个进程都要向相邻的进程发送数据, 同时从相邻
的进程接收数据. MPI提供了捆绑发送和接收操作, 可以在一条MPI语句中同时实现向其它
进程的数据发送和从其它进程接收数据操作. 捆绑发送和接收操作把发送一个消息到一个目的地和从另一个进程接收一个消息合并到一个调用中, 源和目的可以是相同的. 捆绑发送接收操作虽然在语义上等同于一个发送操作
和一个接收操作的结合, 但是它可以有效地避免由于单独书写发送或接收操作时由于次序
的错误而造成的死锁. 这是因为该操作由通信系统来实现, 系统会优化通信次序, 从而有效
地避免不合理的通信次序, 最大限度避免死锁的产生.

```
MPI_SENDRECV(sendbuf,sendcount,sendtype,dest,sendtag,recvbuf,recvcount,
             recvtype, source,recvtag,comm,status)
    IN sendbuf 发送缓冲区起始地址(可选数据类型)
    IN sendcount 发送数据的个数(整型)
    IN sendtype 发送数据的数据类型(句柄)
    IN dest 目标进程标识(整型)
    IN sendtag 发送消息标识(整型)
    OUT recvbuf 接收缓冲区初始地址(可选数据类型)
    IN recvcount 最大接收数据个数(整型)
    IN recvtype 接收数据的数据类型(句柄)
    IN source 源进程标识(整型)
    IN recvtag 接收消息标识(整型)
    IN comm 通信域(句柄)
    OUT status 返回的状态(status)

int MPI_Sendrecv(void *sendbuf, int sendcount,MPI_Datatype sendtype, int dest,
                int sendtag, void *recvbuf, int recvcount, MPI_Datatype recvtype, int source,
                int recvtag, MPI_Comm comm, MPI_Status *status)

# again, 小写字母开头的方法返回数据...

comm.sendrecv(self, sendobj: Any, dest: int, sendtag: int = 0, recvbuf: Optional[Buffer] = None, source: int = ANY_SOURCE, recvtag: int = ANY_TAG, status: Optional[Status] = None) -> Any: ...

# ...大写开头的是修改缓冲区

comm.Sendrecv(self, sendbuf: BufSpec, dest: int, sendtag: int = 0, recvbuf: BufSpec = None, source: int = ANY_SOURCE, recvtag: int = ANY_TAG, status: Optional[Status] = None) -> None: ...

```

捆绑发送接收操作是不对称的, 即一个由捆绑发送接收调用发出的消息可以被一个普通
接收操作接收. 一个捆绑发送接收调用可以接收一个普通发送操作发送的消息,
该操作执行一个阻塞的发送和接收. 接收和发送使用同一个通信域, 但是可能使用不同
的标识, 发送缓冲区和接收缓冲区必须分开. 他们可以是不同的数据长度和不同的数据类型

一个与`MPI_SENDRECV`类似的操作是`MPI_SENDRECV_REPLACE`. 它与`MPI_SENDRECV`的不同就在于它只有一个缓冲区, 该缓冲区同时作为发送缓冲区和接收缓冲区. 这一调用的执行结果是发送前缓冲区中的数据被传递给指定的目的进程, 该缓冲区被
从指定进程接收到的相应类型的数据所取代. 因此从功能上说, 这两者没有什么区别, 只是
`MPI_SENDRECV_REPLACE`相对于`MPI_SENDRECV`节省了一个接收缓冲区(发送缓冲
区公用)

```
MPI_SENDRECV_REPLACE(buf,count,datatype,dest,sendtag,source,recvtag,comm, status)
    INOUT buf 发送和接收缓冲区初始地址(可选数据类型)
    IN count 发送和接收缓冲区中的数据的个数(整型)
    IN datatype 发送和接收缓冲区中数据的数据类型(句柄)
    IN dest 目标进程标识(整型)
    IN sendtag 发送消息标识(整型)
    IN source 源进程标识(整型)
    IN recvtag 接收消息标识(整型)
    IN comm 发送进程和接收进程所在的通信域(句柄)
    OUT status 状态目标(status)

int MPI_Sendrecv_replace(void *buf, int count, MPI_Datatype datatype, int dest, int sendtag,
int source,int recvtag, MPI_Comm comm, MPI_Status *status)

comm.Sendrecv_replace(self, buf: BufSpec, dest: int, sendtag: int = 0, source: int = ANY_SOURCE, recvtag: int = ANY_TAG, status: Optional[Status] = None) -> None: ...

```

对于Jacobi迭代, 发送和接收操作是成对出现的, 因此特别适合使用捆绑发送接收操作
调用. 对于中间块来说, 每一块都要向两侧的相邻块发送数据, 同时也要从两侧的相邻块接
收数据, 可以非常方便地用`MPI_SENDRECV`调用来实现.

![用MPI_SENDRECV实现Jacobi迭代示意图](\mpi\cp11_1.png)

但是对于左侧和右侧的边界块, 却不容易将各自的发送和接收操作合并到一个调用之
中. 因此在程序中, 对边界块仍编写单独的发送和接收语句. 很快, 我们会引入进程拓扑和虚拟进程的概念后, 就可以把边界快和内部等同看待, 全部通信都用`MPI_SENDRECV`实现

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c
```
</template>

<template v-slot:python>

```python
```
</template>

</CodeSwitcher>
