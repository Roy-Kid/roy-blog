---
title: 第七章- 相互问好
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

在许多情况下需要任意两个进程之间都进行数据的交换. 下面给出一个例子, 任意进程
都向其它的进程问好

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c
#include <mpi/mpi.h>
#include <stdio.h>
#include <string.h>

int rank, size;
int namelen;
char processor_name[MPI_MAX_PROCESSOR_NAME];
void hello(void);


int main(int argc, char *argv[])
{

    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    if (size < 2){
        fprintf(stderr, "systest requires at least 2 processes");
        MPI_Abort(MPI_COMM_WORLD, 1);
    }

    if (rank == 0){
        printf("\nHello test from all to all\n\n");
        fflush(stdout);
    }

    MPI_Get_processor_name(processor_name, &namelen);
    fprintf(stderr, "Process %d is alive on %s\n", rank, processor_name);
    fflush(stdout);
    
    MPI_Barrier(MPI_COMM_WORLD);
    hello();

    MPI_Finalize();
}

void hello(void)
{

    int tag = 1;
    int buffer[2], node;
    // buffer[发送进程的rank, 接收进程的rank]
    MPI_Status status;

    for (node = 0; node < size; node++)
    {
        if (node != rank)
        {
            buffer[0] = rank;
            buffer[1] = node;
            MPI_Send(buffer, 2, MPI_INT, node, tag, MPI_COMM_WORLD);
            MPI_Recv(buffer, 2, MPI_INT, node, tag, MPI_COMM_WORLD, &status);
            
            // 如果 (发送进程的rank 不等于 接受的rank) 或者 (接收进程的rank不等于当前进程的rank)
            if (buffer[0] != node || buffer[1] != rank)
            {
                (void)fprintf(stderr, "Hello: %d!=%d or %d!=%d\n",
                              buffer[0], node, buffer[1], rank);
                printf("Mismatch on hello process ids; node = %d\n", node);
            }
        }

        printf("Hello %d, this is %d\n", rank, node);
        fflush(stdout);
    }
}


```
</template>

<template v-slot:python>

```python

from mpi4py import MPI
import numpy as np

comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()
pname = MPI.Get_processor_name()
status = MPI.Status()

def hello():

    buffer = np.zeros(2)
    for node in range(size):
        if node != rank:

            buffer[0] = rank
            buffer[1] = node

            comm.Send(buffer, dest=node, tag=1)
            comm.Recv(buffer, source=node, tag=1, status = status)

            if buffer[0]!=node or buffer[1]!=rank:
                print(f'Hello: {buffer[0]}!={node} or {buffer[1]}!={rank}')
                print(f'Mismatch on hello process ids; node = {node}')

            print(f'Hello {node}, this is {rank}', flush=True)
            
def main():


    if size < 2:
        print("systest requires at least 2 processes")
        comm.Abort()
  
    if (rank == 0):
        print(f'\n---Hello test from all to all---\n')

    print(f'Process {rank} is alive on {pname}', flush=True)
    
    comm.Barrier()
    
    hello()

if __name__ == '__main__':
    main()


```
</template>

</CodeSwitcher>

很有意思的是, 如果不加入`flush=True`和`fflush(stdout);`的话, 输出的顺序会大不一样. 思考一下这是为什么, 对于编写并发的程序有什么启发? 

## MPI预定义数据类型


|MPI预定义类型  |C数据类型  |
|---------|---------|
|MPI_CHAR     |    signed char     |
|MPI_SHORT     |    signed short int     |
|MPI_INT     |     signed int    |
|MPI_LONG     |    signed long     |
|MPI_UNSIGNED_CHAR     |   unsigned char      |
|MPI_UNSIGNED_SHORT     |   unsigned short int      |
|MPI_UNSIGNED     |     unsigned int    |
|MPI_UNSIGNED_LONG     |   unsigned int long    |
|MPI_FLOAT     |    float     |
|MPI_DOUBLE     |   double      |
|MPI_LONG_DOUBLE     |    long double     |
|MPI_BYTE     |    无对应类型     |
|MPI_PACKED     |  无对应类型  |

类型MPI_BYTE的一个值由一个字节组成(8个二进制位). 一个字节不同于一个字符, 因为对
于字符表示不同的机器, 可以用一个以上的字节表示字符. 另一方面, 在所有的机器上, 一个字节有相同的二进制值.

MPI要求支持上述数据类型, 以匹配Fortran 77 和ANSI C的基本数据类型, 如果宿主语
言有附加的数据类型, 那么MPI应提供附加的相应数据类型:


|附加的MPI数据类型  |相应的C数据类型  |
|---------|---------|
|MPI_LONG_LONG_INT    |     long long int    |

对于`mpi4py`, 通过`pickle`这种序列化技术, 可以将原生的`dict`, `list`, `tuple`, `str`等等发送出去, 不需要指定具体的数据类型和数据长度. 为了避免申请内存所带来的时间开销, 可以使用numpy的数组进行这一操作. numpy的底层使用C语言完成, 对于一个不可变的`array`, 已经申请好了地址, 可以作为缓冲区使用. 因此, 可以直接通过`Send()`和`Recv()`发送和接受, 并可以自动推断数据类型和长度.  

