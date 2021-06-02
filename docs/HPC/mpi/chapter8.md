---
title: 第八章- 任意源和标志
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

## MPI消息

### MPI消息组成

MPI消息包括信封和数据两个部分, 信封指出了发送或接收消息的对象及相关信息, 而
数据是本消息将要传递的内容. 信封和数据又分别包括三个部分, 可以用一个三元组来表示: 

```
信封 <源/目 标识 通信域>
数据 <起始地址 数据个数 数据类型>
```

以`MPI_SEND`和`MPI_RECV`为例:

```
MPI_SEND(buf, count, datatype, dest, tag, comm)
         |-------------------| |-------------|
                消息数据           消息信封
         |-------------------| |---------------|
MPI_RECV(buf, count, datatype, source, tag, comm, status)
```
在消息信封中除了源/目外, 为什么还有tag标识呢? 这是因为, 当发送者发送两个相同
类型的数据给同一个接收者时, 如果没有消息标识, 接收者将无法区别这两个消息. 

```
proc 0:                                              proc 1:

MPI_SEND( x,1,整型,1,tag1,comm) 发送消息1 ----------->----|
MPI_SEND( y,1,整型,1,tag2,comm) 发送消息2 --------->---|  |
                                                     |  |
tag2的消息2到达, 没有匹配的接收操作, 先等待,               |  |  标识为tag1的消息1到达,
就是说即使proc0的消息2先到, y也不会被当作x接收,            |  v  类型,标识,源完全匹配.进程1接收消息1
因为tag标识不匹配, 进程1将等待.                          v  |
                                                     |  |
                                      MPI_RECV(x,1,整型,0,tag1,comm,status)
                                                     | 
                                                     v  接收操作相匹配 进程1接收消息2
                                                     |
                                      MPI_RECV(y,1,整型,0,tag2,comm,status)
```

### 任意源和任意标识

一个接收操作对消息的选择是由消息的信封管理的, 如果消息的信封与接收操作所指定
的值source, tag和comm相匹配, 那么这个接收操作能接收这个消息, 接收者可以给source指定
一个任意值`MPI_ANY_SOURCE`, 标识任何进程发送的消息都可以接收. 即本接收操作可以
匹配任何进程发送的消息. 但其它的要求还必须满足, 比如tag的匹配. 如果给tag一个任意
值`MPI_ANY_TAG`, 则任何tag都是可接收的. 在某种程度上, 类似于统配符的概念.
`MPI_ANY_SOURCE`和`MPI_ANY_TAG`可以同时使用或分别单独使用, 但是不能给comm指
定任意值. 如果一个消息被发送到接收进程, 接收进程有匹配的通信域, 有匹配的 source (或
其source = MPI_ANY_SOURCE), 有匹配的tag(或其tag = MPI_ANY_TAG), 那么这个消息能
被这个接收操作接收.
由于`MPI_ANY_SOURCE`和`MPI_ANY_TAG`的存在, 导致了发送操作和接收操作间的不
对称性. 即一个接收操作可以接收任何发送者的消息, 但是对于一个发送操作, 则必须指明
一个单独的接收者.
MPI允许发送者=接收者 (Source = destination) 即一个进程可以给自己发送一个消息. 
但是这种操作要注意死锁的产生. 

### MPI通信域

MPI通信域包括两部分:进程组和通信上下文. 进程组即所有参加通信的进程的集合.
如果一共有N个进程参加通信, 则进程的编号(rank)从0到N-1. 通信上下文提供一个相对独立的通
信区域, 不同的消息在不同的上下文中进行传递, 不同上下文的消息互不干涉. 通信上下文
可以将不同的通信区别开来.
一个预定义的通信域`MPI_COMM_WORLD`由MPI提供. MPI初始化后, 便会产生这一
描述子, 它包括了初始化时可得的全部进程. 进程是由它们在MPI_COMM_WORLD组中的
进程号所标识.
用户可以在原有的通信域的基础上, 定义新的通信域, 通信域为库和通信模式提供一种
重要的封装机制, 他们允许各模式有其自己的独立的通信域, 和它们自己的进程计数方案.

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

#include <mpi/mpi.h>
#include <stdio.h>
#include <string.h>


int main(int argc, char *argv[]) {
    int rank, size, i;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    MPI_Status status;

    int buf[2];

    if (rank == 0){

        // 接受次数 = 每个进程发送次数 x (进程数-1)
        for (i=0; i<10*(size-1); i++){

            MPI_Recv(&buf, 2, MPI_INT, MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &status);
            printf("recv msg from rank:%d with tag:%d\n", status.MPI_SOURCE, status.MPI_TAG);
        }
        
    }

    else {

        // 每个进程发送100次
        for(i=0; i<10; i++)  {
            buf[0] = rank;
            buf[1] = i;
            MPI_Send(&buf, 2, MPI_INT, 0, i, MPI_COMM_WORLD);
        }
        
    }
    MPI_Barrier(MPI_COMM_WORLD);
    MPI_Finalize();

}

```
</template>

<template v-slot:python>

```python

from mpi4py import MPI
import numpy as np

def main():

    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()
    status = MPI.Status()

    buf = np.zeros(2)

    if (rank == 0):

        for i in range(10*(size-1)):
            comm.Recv(buf, source=MPI.ANY_SOURCE, tag=MPI.ANY_TAG, status=status)
            print(f'recv msg from rank:{status.tag} with tag:{status.source}')

    else:

        for i in range(10):
            buf[0] = rank
            buf[1] = i
            comm.Send(buf, dest=0, tag=i)

    comm.Barrier()

if __name__ == '__main__':
    main()

```
</template>

</CodeSwitcher>