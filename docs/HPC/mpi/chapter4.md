---
title: 第四章- 你发送, 我接受
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

下面介绍一个简单的同时包含发送和接收调用的例子. 其中一个进程(进程0)向另一
个进程(进程1)发送一条消息. 进程1在接收到该消息后, 将这一消息打印到屏幕上.

## C语言实现

```c
#include "mpi.h"
    int main(int argc, int *argv[]){
        char message[20];
        int myrank;
        MPI_Init( &argc, &argv );
        /* MPI程序的初始化*/
        MPI_Comm_rank( MPI_COMM_WORLD, &myrank );
        /* 得到当前进程的标识*/
        if (myrank == 0) { /* 若是 0 进程*/

            /* 先将字符串拷贝到发送缓冲区message中, 然后调用MPI_Send语句将它发出, 用
            strlen(message)指定消息的长度, 用MPI_CHAR指定消息的数据类型 1指明发往进程1, 使
            用的消息标识tag是99. MPI_COMM_WORLD是包含本进程 (进程0) 和接收消息的进程 进(
            程1) 的通信域. 发送方和接收方必须在同一个通信域中, 由通信域来统一协调和控制消息
            的发送和接收*/

            strcpy(message,"Hello, process 1");
            MPI_Send(message, strlen(message), MPI_CHAR, 1, 99,MPI_COMM_WORLD);
        }

        else if(myrank==1) { /* 若是进程 1 */

            /*进程1直接执行接收消息的操作, 这里它使用message作为接收缓冲区. 由此可见, 对于同
            一个变量, 在发送进程和接收进程中的作用是不同的. 它指定接收消息的最大长度为20, 消
            息的数据类型为MPI_CHAR字符型. 接收的消息来自进程0, 而接收消息携带的标识必须为
            99, 使用的通信域也是MPI_COMM_WORLD. 接收完成后的各种状态信息存放在status中
            接收完成后, 它直接将接收到的字符串打印在屏幕上 */

            MPI_Recv(message, 20, MPI_CHAR, 0, 99, MPI_COMM_WORLD, &status);
            printf("received :%s:", message);
        }

        MPI_Finalize(); /* MPI程序结束*/
}
```

而在`mpi4py`中, 有三种不同发送接收模式. 

* 小写函数名:

    * MPI.COMM_WORLD.send() 和 MPI.COMM_WORLD.recv(). 可以直接将python object发送出去, 然后recv()直接返回接受的值;
    * MPI.COMM_WORLD.isend() 和 MPI.COMM_WORLD.irecv(). 同样是发送python object, 但是返回的是一个`Request`实例(instance, 因此是i开头). 这个实例可以调用成员函数`test()`和`wait()`

* 大写函数名:

    * MPI.COMM_WORLD.Send() 和 MPI.COMM_WORLD.Recv(). 这个函数需要发送一个缓冲类型的类, 入参的形式是[data, MPI.DOUBLE]或[data, count, MPI.CHAR]. 前者的`data`是byte型, `count`大小由MPI的数据类型决定. 

## 发送python对象

```python
from mpi4py import MPI

comm = MPI.COMM_WORLD
rank = comm.Get_rank()

if rank == 0:
    data = {'a': 7, 'b': 3.14}
    comm.send(data, dest=1, tag=11)
elif rank == 1:
    data = comm.recv(source=0, tag=11)
```

## 以非阻塞的方式发送python对象

```python
from mpi4py import MPI

comm = MPI.COMM_WORLD
rank = comm.Get_rank()

if rank == 0:
    data = {'a': 7, 'b': 3.14}
    req = comm.isend(data, dest=1, tag=11)
    req.wait()
elif rank == 1:
    req = comm.irecv(source=0, tag=11)
    data = req.wait()
```

## 发送numpy数组(最快!)

```python
from mpi4py import MPI
import numpy

comm = MPI.COMM_WORLD
rank = comm.Get_rank()

# passing MPI datatypes explicitly
# 显式地指定数据类型
if rank == 0:
    data = numpy.arange(1000, dtype='i')
    comm.Send([data, MPI.INT], dest=1, tag=77)
elif rank == 1:
    data = numpy.empty(1000, dtype='i')
    comm.Recv([data, MPI.INT], source=0, tag=77)

# automatic MPI datatype discovery
# 自动识别数据类型
if rank == 0:
    data = numpy.arange(100, dtype=numpy.float64)
    comm.Send(data, dest=1, tag=13)
elif rank == 1:
    data = numpy.empty(100, dtype=numpy.float64)
    comm.Recv(data, source=0, tag=13)
```


::: right

支持NumPy数组的数据类型识别和PEP-3118规定的缓存方式, 但是受制于原生C类型(所有的C/C99原生 符号/无符号整数类型 和 单/双精度实数和虚数的浮点类型)以及底层MPI实现中匹配数据类型的可用性. 在这种情况下, 缓冲区提供程序对象可以作为缓冲区参数直接传递, 将推断count和MPI datatype. 

Automatic MPI datatype discovery for NumPy arrays and PEP-3118 buffers is supported, but limited to basic C types (all C/C99-native signed/unsigned integral types and single/double  precision real/complex floating types) and availability of matching datatypes in the underlying MPI implementation. In this case, the buffer-provider object can be passed directly as a buffer argument, the count and MPI datatype will be inferred.

来自 [mpi4py](https://mpi4py.readthedocs.io/en/stable/tutorial.html)
:::