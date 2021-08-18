---
title: 第x章- 组通信
date: 2021-06-16
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

## 组通信概述

MPI组通信和点到点通信的一个重要区别, 就在于它需要一个特定组内的所有进程同时
参加通信, 而不是象点到点通信那样只涉及到发送方和接收方两个进程. 组通信在各个不同
进程的调用形式完全相同, 而不象点到点通信那样在形式上就有发送和接收的区别. 本章主
要介绍如何使用MPI提供的各种组通信功能, 方便编程, 提高程序的可读性和移植性, 提高
通信效率.

组通信由哪些进程参加, 以及组通信的上下文, 都是由该组通信调用的通信域限定的.
组通信调用可以和点对点通信共用一个通信域, MPI保证由组通信调用产生的消息不会和点
对点调用产生的消息相混淆, 在组通信中不需要通信消息标志参数, 如果将来的MPI新版本
定义了非阻塞的组通信函数, 也许那时就需要引入消息标志来防止组通信彼此之间造成的混
淆.

组通信一般实现三个功能, 通信, 同步和计算. 通信功能主要完成组内数据的传输, 而
同步功能实现组内所有进程在特定的地点在执行进度上取得一致, 计算功能稍微复杂一点
要对给定的数据完成一定的操作.

## 组通信的消息通信功能

对于组通信, 按通信的方向的不同, 又可以分为以下三种: 一对多通信, 多对一通信和
多对多通信.

如图所示的一对多通信, 其中一个进程向其它所有的进程发送消息. 一般地, 把这
样的进程称为ROOT. 在一对多的组通信中, 调用的某些参数只对ROOT有意义, 对其它的
进程只是满足语法的要求. 广播是最常见的一对多通信的例子. 同样对于多对一通信, 一个
进程从其它所有的进程接收消息, 这样的进程也称为ROOT. 收集是最常见的多对一通信的
例子.

这是多对多通信, 其中每一个进程都向其它所有的进程发送消息, 或者每个
进程都从其它所有的进程接收消息, 或者每个进程都同时向所有其它的进程发送和从其它所
有的进程接收消息.

一个进程完成了它自身的组通信调用返回后, 就可以释放数据缓冲区或使用缓冲区中的
数据, 但是一个进程组通信的完成并不表示其它所有进程的组通信都已完成, 即组通信并不
一定意味着同步的发生, 当然同步组通信调用除外.

## 组通信的同步功能

同步是许多应用中必须提供的功能, 组通信的还提供专门的调用以完成各个进程之间的
同步, 从而协调各个进程的进度和步伐.

如图所示, 所有的进程并行执行. 但是, 不同的进程执行的进度是不同的. 在本例中, 进程0首先执行到同步调用, 执行同步操作. 但是, 由于其它的进程还没有到达同步调
用点, 因此进程0只好等待, 接下来是其它的进程(如进程N-1)陆续到达同步调用点, 但
是, 只要有一个进程未到达同步调用点, 则所有其它已到达同步调用点的进程都必须得等待
当最后到达同步调用点的进程--进程1到达同步调用点后, 它也执行了同步调用操作, 这时
由于所有的进程都执行了这一操作, 因此, 它们此时才可以从同步调用返回, 继续并行执行
下面的操作.

**同步的作用是当进程完成同步调用后, 可以保证所有的进程都已执行了同步点前面的操
作.**

## 组通信的计算功能

组通信除了能够完成通信和同步的功能外, 还可以进行计算, 完成计算的功能. 从效果
上, 可以认为, MPI组通信的计算功能是分三步实现的: 首先是通信的功能, 即消息根据要
求发送到目的进程, 目的进程也已经接收到了各自所需要的消息; 然后是对消息的处理, 即
计算部分, MPI组通信有计算功能的调用都指定了计算操作, 用给定的计算操作对接收到的
数据进行处理; 最后一步是将处理结果放入指定的接收缓冲区.

## 广播

```
MPI_BCAST(buffer,count,datatype,root,comm)
IN/OUT buffer 通信消息缓冲区的起始地址(可选数据类型)
IN count 将广播出去/或接收的数据个数(整型)
IN datatype 广播/接收数据的数据类型(句柄)
IN root 广播数据的根进程的标识号(整型)
IN comm 通信域(句柄)

int MPI_Bcast(void* buffer,int count,MPI_Datatype datatype,int root, MPI_Comm comm)


```

`MPI_BCAST`是一对多组通信的典型例子, 它完成从一个标识为root的进程将一条消息
广播发送到组内的所有其它的进程, 同时也包括它本身在内. 在执行该调用时组内所有进程
不管是root进程本身还是其它的进程, 都使用同一个通信域comm和根标识root, 其执行结
果是将根进程通信消息缓冲区中的消息拷贝到其他所有进程中去.

一般说来, 数据类型`datatype`可以是预定义数据类型或派生数据类型, 其它进程中指定
的通信元素个数`count`, 数据类型`datatype`必须和根进程中的指定的通信元素个数`count`, 数据
类型`datatype`保持一致, 即对于广播操作调用, 不管是广播消息的根进程, 还是从根接收消
息的其它进程, 在调用形式上完全一致, 即指明相同的根, 相同的元素个数以及相同的数据
类型. 除`MPI_BCAST`之外, 其它完成通信功能的组通信调用都有此限制.

下面的程序首先由ROOT进程从键盘读如一个整数, 然后广播到其它所有的进程, 各进
程打印出收到的数据, 若该数据非负, 则循环执行上面的步骤.

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

#include <stdio.h>
#include "mpi.h"

int main( int argc, char **argv ) {

    int rank, value;
    MPI_Init( &argc, &argv );
    MPI_Comm_rank( MPI_COMM_WORLD, &rank );
    do {
        if (rank == 0) /*进程0读入需要广播的数据*/
        scanf( "%d", &value );
        MPI_Bcast( &value, 1, MPI_INT, 0, MPI_COMM_WORLD );/*将该数据广播出去*/
        printf( "Process %d got %d\n", rank, value );/*各进程打印收到的数据*/
    } while (value >= 0);
    
    MPI_Finalize( );
    return 0;
}

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>


## 收集

收集`MPI_GATHER`是典型的多对一通信的例子. 在收集调用中, 每个进程, 包括根进
程本身, 将其发送缓冲区中的消息发送到根进程, 根进程根据发送进程的进程标识的序号即
进程的rank值, 将它们各自的消息依次存放到自已的消息缓冲区中. 和广播调用不同的是
广播出去的数据都是相同的, 但对于收集操作, 虽然从各个进程收集到的数据的个数必须相
同, 但从各个进程收集到的数据一般是互不相同的. 其结果就象一个进程组中的N个进程, 包
括根进程在内, 都执行了一个发送调用, 同时根进程执行了N次接收调用.

对于所有非根进程, 接收消息缓冲区被忽略, 但是各个进程必须提供这一参数.

收集调用每个进程的发送数据个数`sendcount`和发送数据类型`sendtype`都是相同的, 都和
根进程中接收数据个数`recvcount`和接收数据类型`recvtype`相同. 注意根进程中指定的接收数
据个数是指从每一个进程接收到的数据的个数, 而不是总的接收个数.

此调用中的所有参数对根进程来说都是有意义的, 而对于其它进程只有 `sendbuf`
`sendcount` `sendtype` `root`和`comm`是有意义的. 其它的参数虽然没有意义, 但是却不能省略.
`root`和`comm`在所有进程中都必须是一致的.

```
MPI_GATHER(sendbuf, sendcount, sendtype, recvbuf, recvcount, recvtype, root , comm)
IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcount 发送消息缓冲区中的数据个数(整型)
IN sendtype 发送消息缓冲区中的数据类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可选数据类型)
IN recvcount 待接收的元素个数(整型,仅对于根进程有意义)
IN recvtype 接收元素的数据类型(句柄,仅对于根进程有意义)
IN root 接收进程的序列号(整型)
IN comm 通信域(句柄)

int MPI_Gather(void* sendbuf, int sendcount, MPI_Datatype sendtype,
        void* recvbuf, int recvcount, MPI_Datatype recvtype,
        int root, MPI_Comm comm)
```

`MPI_GATHERV`和`MPI_GATHER`的功能类似, 也完成数据收集的功能, 但是它可以从不
同的进程接收不同数量的数据. 为此, 接收数据元素的个数`recvcounts`是一个数组, 用于指
明从不同的进程接收的数据元素的个数. 根从每一个进程接收的数据元素的个数可以不同,
但是发送和接收的个数必须一致. 除此之外, 它还为每一个接收消息在接收缓冲区的位置提
供了一个位置偏移`displs`数组, 用户可以将接收的数据存放到根进程消息缓冲区的任意位置.
也就是说, `MPI_GATHERV`明确指出了从不同的进程接收数据元素的个数以及这些数据在
`ROOT`的接收缓冲区存放的起始位置 这是它相对于MPI_GATHER灵活的地方 也是比
MPI_GATHER复杂的地方
此调用中的所有参数对根进程来说都是有意义的 而对于其它的进程只有sendbuf
sendcount sendtype root和comm是有意义的 参数root和comm在所有进程中都必须是一致
的

```

MPI_GATHERV(sendbuf, sendcount, sendtype, recvbuf, recvcounts, displs,recvtype,
root, comm)

IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcount 发送消息缓冲区中的数据个数(整型)
IN sendtype 发送消息缓冲区中的数据类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可选数据类型,仅对于根进程有意义)
IN recvcounts 整型数组(长度为组的大小), 其值为从每个进程接收的数据个数
IN displs 整数数组,每个入口表示相对于recvbuf的位移
IN recvtype 接收消息缓冲区中数据类型 (句柄)
IN root 接收进程的标识号(句柄)
IN comm 通信域(句柄)

int MPI_Gatherv(void* sendbuf, int sendcount, MPI_Datatype sendtype, void* recvbuf,
int *recvcounts, int *displs, MPI_Datatype recvtype, int root, MPI_Comm comm)

```

下面的程序片段实现从进程组中的每个进程收集100个整型数送给根进程

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

MPI_Comm comm;
int gsize,sendarray[100];
int root,*rbuf;
......
MPI_Comm_size(comm,&gsize);
rbuf=(int *)malloc(gsize*100*sizeof(int));
MPI_Gather(sendarray,100,MPI_INT,rbuf,100,MPI_INT,root,comm);

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

下面的程序实现每个进程向根进程发送100个整型数, 但在接收端设置(100个数据)步长,
用MPI_GATHERV调用和displs参数来实现. 假设步长≥100

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

MPI_Comm comm;
int gsize, sendarray[100];
int root, *rbuf, stride;
int *displs, i, *rcounts;
......
MPI_Comm_size(comm, &gsize);

rbuf = (int *)malloc(gsize*stride*sizeof(int));
displs = (int *)malloc(gsize*sizeof(int));
rcounts = (int *)malloc(gsize*sizeof(int));
for (i=0; i<gsize; ++i) {
displs[i] = i*stride;
rcounts[i] = 100;
}
MPI_Gatherv(sendarray, 100, MPI_INT, rbuf, rcounts, displs, MPI_INT,
root, comm);

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

## 散发

MPI_SCATTER是一对多的组通信调用, 但是和广播不同, ROOT向各个进程发送的数
据可以是不同的. MPI_SCATTER和MPI_GATHER的效果正好相反, 两者互为逆操作.

对于所有非根进程, 发送消息缓冲区被忽略, 根进程中的发送数据元素个数sendcount和
发送数据类型sendtype必须和所有进程的接收数据元素个数recvcount和接收数据类型recvtype
相同. 根进程发送元素个数指的是发送给每一个进程的数据元素的个数, 而不是总的数据个
数. 这就意味着在每个进程和根进程之间, 发送的数据个数必须和接收的数据个数相等.

此调用中的所有参数对根进程来说都是有意义的, 而对于其他进程来说, 只有recvbuf
recvcount recvtype root和comm是有意义的. 参数root和comm在所有进程中都必须是一致
的.

MPI_GATHER有一个更灵活的形式MPI_GATHERV, MPI_SCATTER也有一个更灵活的
形式MPI_SCATTERV.

正如MPI_SCATTER是MPI_GATHER的逆操作一样, MPI_SCATTERV是MPI_GATHERV
的逆操作.

MPI_SCATTERV对MPI_SCATTER的功能进行了扩展, 它允许ROOT向各个进程发送个
数不等的数据, 因此要求sendcounts是一个数组, 同时还提供一个新的参数displs, 指明根进
程发往其它不同进程数据在根发送缓冲区中的偏移位置. 对于所有非根进程, 发送消息缓冲
区被忽略, 根进程中sendcount[i]和sendtype的类型必须和进程i的recvcount和recvtype的类型
相同. 这就意味着在每个进程和根进程之间发送的数据量必须和接收的数据量相等.

此调用中的所有参数对根进程来说都是很重要的, 而对于其他进程来说只有recvbuf recvcount recvtype root和comm是必不可少的. 参数root和comm在所有进程中都必须是一
致的,

```

MPI_SCATTER(sendbuf,sendcount,sendtype,recvbuf,recvcount,recvtype,
root,comm)
IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcount 发送到各个进程的数据个数(整型)
IN sendtype 发送消息缓冲区中的数据类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可选数据类型)
IN recvcount 待接收的元素个数(整型)
IN recvtype 接收元素的数据类型(句柄)
IN root 发送进程的序列号(整型)
IN comm 通信域(句柄)

int MPI_Scatter(void* sendbuf, int sendcount, MPI_Datatype sendtype,
                void* recvbuf, int recvcount, MPI_Datatype recvtype,
                int root, MPI_Comm comm)

```

```
MPI_SCATTERV(sendbuf, sendcounts, displs, sendtype, recvbuf, recvcount, recvtype, root,
comm)

IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcounts 发送数据的个数 整数数组 (整型)
IN displs 发送数据偏移 整数数组(整型)
IN sendtype 发送消息缓冲区中元素类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可变)
IN recvcount 接收消息缓冲区中数据的个数(整型)
IN recvtype 接收消息缓冲区中元素的类型(句柄)
IN root 发送进程的标识号(句柄)
IN comm 通信域(句柄)

int MPI_Scatterv(void* sendbuf, int *sendcounts, int *displs, MPI_Datatype sendtype,
                void* recvbuf, int recvcount, MPI_Datatype recvtype, int root,
                MPI_Comm comm)
```

下面的程序片段实现根进程将向组内的每个进程分散100个整型数据

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

MPI_Comm comm;
int gsize,*sendbuf;
int root,rbuf[100];
......
MPI_Comm_size(comm, &gsize);
sendbuf = (int *)malloc(gsize*100*sizeof(int));
......
MPI_Scatter(sendbuf, 100, MPI_INT, rbuf, 100, MPI_INT, root, comm);

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

下面的程序片段实现根进程将向组内的每个进程分散100个整型数据, 但这每100个数据
的集合在根进程的发送消息缓冲区中相隔一定的步长.

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

MPI_Comm comm;
int gsize,*sendbuf;
int root,rbuf[100],i,*displs,*scounts;
......
MPI_Comm_size(comm, &gsize);
sendbuf = (int *)malloc(gsize*stride*sizeof(int));
......
displs = (int *)malloc(gsize*sizeof(int));
scounts = (int *)malloc(gsize*sizeof(int));
for (i=0; i<gsize; ++i) {
displs[i] = i*stride;
scounts[i] = 100;
}
MPI_Scatterv(sendbuf, scounts, displs, MPI_INT, rbuf, 100,
             MPI_INT, root, comm);

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

## 组收集

MPI_GATHER是将数据收集到ROOT进程, 而MPI_ALLGATHER相当于每一个进程都作
为ROOT执行了一次MPI_GATHER调用. 即每一个进程都收集到了其它所有进程的数据. 从
参数上看, MPI_ALLGATHER 和MPI_GATHER完全相同, 只不过在执行效果上, 对于
MPI_GATHER执行结束后, 只有ROOT进程的接收缓冲区有意义. MPI_ALLGATHER调用
结束后所有进程的接收缓冲区都有意义, 它们接收缓冲区的内容是相同的.

由 MPI_ALLGATHER 和 MPI_GATHER 的关系不难得知, MPI_ALLGATHERV 和
MPI_GATHERV的关系, MPI_ALLGATHERV也是所有的进程都将接收结果 ,而不是只有根
进程接收结果. 从每个进程发送的第j块数据将被每个进程接收, 然后存放在各个进程接收
消息缓冲区recvbuf的第j块, 进程j的sendcount和sendtype的类型必须和其他所有进程的recvcounts[j]和recvtype相同.

```
MPI_ALLGATHER(sendbuf, sendcount, sendtype, recvbuf, recvcount,
recvtype,comm)
IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcount 发送消息缓冲区中的数据个数(整型)
IN sendtype 发送消息缓冲区中的数据类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可选数据类型)
IN recvcount 从其它进程中接收的数据个数(整型)
IN recvtype 接收消息缓冲区的数据类型(句柄)
IN comm 通信域(句柄)
int MPI_Allgather(void* sendbuf, int sendcount, MPI_Datatype sendtype,
                  void* recvbuf, int recvcount, MPI_Datatype recvtype,
                  MPI_Comm comm)
```

```
MPI_ALLGATHERV(sendbuf, sendcount, sendtype, recvbuf, recvcounts, displs, recvtype,
comm)

IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcount 发送消息缓冲区中的数据个数(整型)
IN sendtype 发送消息缓冲区中的数据类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可选数据类型)
IN recvcounts 接收数据的个数 整型数组(整型)
IN displs 接收数据的偏移 整数数组(整型)
IN recvtype 接收消息缓冲区的数据类型(句柄)
IN comm 通信域(句柄)

int MPI_Allgatherv(void* sendbuf, int sendcount,MPI_Datatype sendtype,
                    void* recvbuf, int *recvcounts, int *displs,
                    MPI_Datatype recvtype, MPI_Comm comm)
```

下面的程序片段实现组内每个进程都从其它进程收集100个数据, 存入各自的接收缓冲
区

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c
MPI_Comm comm;
int gsize,sendarray[100];
int *rbuf;
......
MPI_Comm_size(comm, &gsize);
rbuf = (int *)malloc(gsize*100*sizeof(int));
MPI_Allgather(sendarray, 100, MPI_INT, rbuf, 100, MPI_INT, comm);
```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>



<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

MPI_Comm comm;
int gsize, sendarray[100];
int root, *rbuf, stride;
int *displs, i, *rcounts;
......
MPI_Comm_size(comm, &gsize);
rbuf = (int *)malloc(gsize*stride*sizeof(int));
displs = (int *)malloc(gsize*sizeof(int));

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

用MPI_Allgatherv来实现

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

rcounts = (int *)malloc(gsize*sizeof(int));
for (i=0; i<gsize; ++i) {
displs[i] = i*stride;
rcounts[i] = 100;
}
MPI_Allgatherv(sendarray, 100, MPI_INT, rbuf, rcounts, displs, MPI_INT,
root, comm);

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

## 全互换

MPI_ALLTOALL是组内进程之间完全的消息交换, 其中每一个进程都相其它所有的进
程发送消息, 同时, 每一个进程都从其它所有的进程接收消息.

MPI_ALLGATHER每个进程散发一个相同的消息给所有的进程, MPI_ALLTOALL散发
给不同进程的消息是不同的, 因此它的发送缓冲区也是一个数组. MPI_ALLTOALL的每个
进程可以向每个接收者发送数目不同的数据 ,第i个进程发送的第j块数据将被第j个进程接收
并存放在其接收消息缓冲区recvbuf的第i块. 每个进程的sendcount和sendtype的类型必须和所
有其他进程的recvcount和recvtype相同, 这就意谓着在每个进程和根进程之间, 发送的数据
量必须和接收的数据量相等.

调用MPI_ALLTOALL相当于每个进程依次将它的发送缓冲区的第i块数据发送给第i个进
程, 同时每个进程又都依次从第j个进程接收数据放到各自接收缓冲区的第j块数据区的位
置.

```
MPI_ALLTOALL(sendbuf, sendcount, sendtype, recvbuf, recvcount,
recvtype, comm)
IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcount 发送到每个进程的数据个数(整型)
IN sendtype 发送消息缓冲区中的数据类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可选数据类型)
IN recvcount 从每个进程中接收的元素个数(整型)
IN recvtype 接收消息缓冲区的数据类型(句柄)
IN comm 通信域(句柄)
int MPI_Alltoall(void* sendbuf, int sendcount, MPI_Datatype sendtype,
                void* recvbuf, int recvcount, MPI_Datatype recvtype,
                MPI_Comm comm)
```

从图中可以看出, 在互换之前依次将各进程的发送缓冲区组织在一起, 互换之后依次将
各进程的接收缓冲区组织在一起, 则接收缓冲区组成的矩阵是发送缓冲区组成的矩阵的转置
(若每次向一个进程发送的数据是多个, 则将这多个数据看作是一个数据单元).

下面的程序使用MPI_ALLTOALL调用. 它在调用之间, 每一个进程将所有发往其它不
同进程的数据打印, 调用结束后, 再将所有从其它进程接收的数据打印, 从中可以看出发送
和接收的对应关系.

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

#include "mpi.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>
int main( argc, argv )
int argc;
char *argv[];
{
int rank, size;
int chunk = 2;
/*发送到一个进程的数据块的大小*/
int i,j;
int *sb;
int *rb;
int status, gstatus;
MPI_Init(&argc,&argv);
MPI_Comm_rank(MPI_COMM_WORLD,&rank);
MPI_Comm_size(MPI_COMM_WORLD,&size);
sb = (int *)malloc(size*chunk*sizeof(int));/*申请发送缓冲区*/
if ( !sb ) {
perror( "can't allocate send buffer" );
MPI_Abort(MPI_COMM_WORLD,EXIT_FAILURE);
}
rb = (int *)malloc(size*chunk*sizeof(int));/*申请接收缓冲区*/
if ( !rb ) {
perror( "can't allocate recv buffer");
free(sb);
MPI_Abort(MPI_COMM_WORLD,EXIT_FAILURE);
}
for ( i=0 ; i < size ; i++ ) {
for ( j=0 ; j < chunk ; j++ ) {
sb[i*chunk+j] = rank + i*chunk+j;/*设置发送缓冲区的数据*/
printf("myid=%d,send to id=%d, data[%d]=%d\n",rank,i,j,sb[i*chunk+j]);
rb[i*chunk+j] = 0;/*将接收缓冲区清0*/
}
}
/* 执行MPI_Alltoall 调用*/
MPI_Alltoall(sb,chunk,MPI_INT,rb,chunk,MPI_INT,
MPI_COMM_WORLD);
for ( i=0 ; i < size ; i++ ) {
for ( j=0 ; j < chunk ; j++ ) {
printf("myid=%d,recv from id=%d, data[%d]=%d\n",rank,i,j,rb[i*chunk+j]);
/*打印接收缓冲区从其它进程接收的数据*/
}
}
free(sb);
free(rb);
MPI_Finalize();
}

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

正如 MPI_ALLGATHERV 和 MPI_ALLGATHER 的关系一样, MPI_ALLTOALLV 在
MPI_ALLTOALL的基础上进一步增加了灵活性. 它可以由sdispls指定待发送数据的位置
在接收方则由rdispls指定接收的数据存放在缓冲区的偏移量.

所有参数对每个进程都是有意义的, 并且所有进程中的comm值必须一致

MPI_ALLTOALL和MPI_ALLTOALLV可以实现n次独立的点对点通信, 但也有限制 1.
所有数据必须是同一类型; 2.所有的消息必须按顺序进行散发和收集.

```
MPI_ALLTOALLV(sendbuf, sendcounts, sdispls, sendtype, recvbuf,
recvcounts, rdispls, recvtype, comm)
IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
IN sendcounts 向每个进程发送的数据个数(整型数组)
IN sdispls 向每个进程发送数据的位移 整型数组
IN sendtype 发送数据的数据类型(句柄)
OUT recvbuf 接收消息缓冲区的起始地址(可选数据类型)
IN recvcounts 从每个进程中接收的数据个数(整型数组)
IN rdispls 从每个进程接收的数据在接收缓冲区的位移 整型数组
IN recvtype 接收数据的数据类型(句柄)
IN comm 通信域(句柄)
int MPI_Alltoallv(void* sendbuf, int *sendcounts, int *sdispls,
                    MPI_Datatype sendtype, void* recvbuf,
                    int *recvcounts, int *rdispls,
                    MPI_Datatype recvtype, MPI_Comm comm)
```

## 同步

```
MPI_BARRIER(comm)
IN comm 通信域(句柄)

int MPI_Barrier(MPI_Comm comm)
```

MPI_BARRIER阻塞所有的调用者直到所有的组成员都调用了它, 各个进程中这个调用
才可以返回.

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c
#include "mpi.h"
#include "test.h"
#include <stdlib.h>
#include <stdio.h>
int main( int argc, char **argv )
{
int rank, size, i;
int *table;
int errors=0;
MPI_Aint address;
MPI_Datatype type, newtype;
int lens;
MPI_Init( &argc, &argv );
MPI_Comm_rank( MPI_COMM_WORLD, &rank );
MPI_Comm_size( MPI_COMM_WORLD, &size );
/* Make data table */
table = (int *) calloc (size, sizeof(int));
table[rank] = rank + 1; /*准备要广播的数据*/
MPI_Barrier ( MPI_COMM_WORLD );
/* 将数据广播出去*/
for ( i=0; i<size; i++ )
MPI_Bcast( &table[i], 1, MPI_INT, i, MPI_COMM_WORLD );
/* 检查接收到的数据的正确性 */
for ( i=0; i<size; i++ )
if (table[i] != i+1) errors++;
MPI_Barrier ( MPI_COMM_WORLD );/*检查完毕后执行一次同步*/
...
/*其它的计算*/
MPI_Finalize();
}

```
</template>

<template v-slot:>

```
```
</template>

</CodeSwitcher>

## 归约

MPI_REDUCE将组内每个进程输入缓冲区中的数据按给定的操作op进行运算, 并将其
结果返回到序列号为root的进程的输出缓冲区中. 输入缓冲区由参数sendbuf count和datatype
定义, 输出缓冲区由参数recvbuf count和datatype定义, 要求两者的元素数目和类型都必须
相同. 因为所有组成员都用同样的参数count datatype op root和comm来调用此例程, 故
而所有进程都提供长度相同, 元素类型相同的输入和输出缓冲区. 每个进程可能提供一个元
素或一系列元素, 组合操作依次针对每个元素进行.

操作op始终被认为是可结合的, 并且所有MPI定义的操作被认为是可交换的. 用户自定
义的操作被认为是可结合的, 但可以不是可交换的.

```
MPI_REDUCE(sendbuf,recvbuf,count,datatype,op,root,comm)

IN sendbuf 发送消息缓冲区的起始地址(可选数据类型)
OUT recvbuf 接收消息缓冲区中的地址(可选数据类型)
IN count 发送消息缓冲区中的数据个数(整型)
IN datatype 发送消息缓冲区的元素类型(句柄)
IN op 归约操作符(句柄)
IN root 根进程序列号(整型)
IN comm 通信域(句柄)

int MPI_Reduce(void* sendbuf, void* recvbuf, int count, PI_Datatype datatype,
                MPI_Op op, int root, MPI_Comm comm)
```


