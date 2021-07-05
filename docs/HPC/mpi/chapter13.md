---
title: 第十章- 安全的MPI程序
date: 2021-06-02
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

这是主从模式的第二个例子. 主进程proc 0 负责接受从进程发送的消息, 根据tag类型不同, 选择顺序打印还是非顺序打印. 

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

#include <mpi/mpi.h>
#include <stdio.h>
#include <string.h>

int master_io(void);
int slave_io(void);

int main(int argc, char *argv[])
{
    int rank;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    if (rank == 0)
        master_io(); // proc 0 是主进程
    else
        slave_io(); // 其他为从进程

    MPI_Finalize();
}

#define MSG_EXIT 1
#define MSG_PRINT_ORDERED 2
#define MSG_PRINT_UNORDERED 3

int master_io(void)
{
    int i, size, nslave, firstmsg;
    char buf[256], buf2[256];
    MPI_Status status;

    MPI_Comm_size(MPI_COMM_WORLD, &size);
    nslave = size - 1; // 从进程数
    while (nslave > 0)
    {
        // 从任意从进程接收消息
        MPI_Recv(buf, 256, MPI_CHAR, MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &status);

        switch (status.MPI_TAG)
        {

        // 若该从进程要求退出 则将总的从进程个数减1
        case MSG_EXIT:
            nslave--;
            break;

        // 若非顺序输出, 直接打印
        case MSG_PRINT_UNORDERED:
            fputs(buf, stdout);
            break;

        // 若顺序输出, 先对收到的消息排序
        // 如果有些消息没有收到, 则主动接受相应的有序消息
        case MSG_PRINT_ORDERED:
            firstmsg = status.MPI_SOURCE;
            for (i = 1; i < size; i++) // 从标志号小的开始打印
            {
                if (i == firstmsg)
                    // 如果当前消息正好是需要打印的, 直接打印
                    fputs(buf, stdout);
                else
                {
                    // 否则先接受, 再打印. 注意源被指定为需要的标志号
                    MPI_Recv(buf2, 256, MPI_CHAR, i, MSG_PRINT_ORDERED, MPI_COMM_WORLD, &status);
                    fputs(buf2, stdout);
                }
            }
            break;
        }
    }
}

int slave_io(void)
{
    char buf[256];
    int rank;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);

    sprintf(buf, "hello from slave %d, ordered, print\n", rank);

    /*先向主进程发送一个有序打印消息*/
    MPI_Send(buf, strlen(buf) + 1, MPI_CHAR, 0, MSG_PRINT_ORDERED, MPI_COMM_WORLD);
    
    /*再向主进程发送一个有序打印消息*/
    sprintf(buf, "Goodbye from slave %d, ordered print\n", rank);
    MPI_Send(buf, strlen(buf) + 1, MPI_CHAR, 0, MSG_PRINT_ORDERED,
             MPI_COMM_WORLD); 

    /*最后 向主进程发送一个乱续打印消息*/
    sprintf(buf, "I'm exiting (%d),unordered print\n", rank);
    MPI_Send(buf, strlen(buf) + 1, MPI_CHAR, 0, MSG_PRINT_UNORDERED,
             MPI_COMM_WORLD); 

    /*向主进程发送退出执行的消息*/         
    MPI_Send(buf, 0, MPI_CHAR, 0, MSG_EXIT, MPI_COMM_WORLD);
}


```
</template>

<template v-slot:python>

```python

from mpi4py import MPI

def main():

    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()

    if rank == 0:
        master_io(comm)
    else:
        slave_io(comm)

MSG_EXIT = 1
MSG_PRINT_ORDERED = 2
MSG_PRINT_UNORDERED = 3

def master_io(comm):

    size = comm.Get_size()
    status = MPI.Status()

    nslave = size - 1
    while nslave > 0:

        data = comm.recv(source=MPI.ANY_SOURCE, tag=MPI.ANY_TAG)

        if status.tag == MSG_EXIT:
            nslave-=1
            break
        
        elif status.tag == MSG_PRINT_UNORDERED:
            print(data, flush=True)

        elif status.tag == MSG_PRINT_ORDERED:
            firstmsg = status.source
            for i in range(1, size):
                if i == firstmsg:
                    print(data, flush=True)
                else:
                    data = comm.recv(source=i, tag=MSG_PRINT_ORDERED, status = status)

def slave_io(comm):

    rank = comm.Get_rank()

    msg = f'hello from slave {rank}, ordered, print\n'

    comm.send(msg, dest=0, tag=MSG_PRINT_ORDERED)

    msg = f'Goodbye from slave {rank}, ordered print\n'

    comm.send(msg, dest=0, tag=MSG_PRINT_ORDERED)

    msg = f"I'm exiting {rank},unordered print\n"

    comm.send(msg, dest=0, tag=MSG_PRINT_UNORDERED)

    comm.send(msg, dest=0, tag=MSG_EXIT)

if __name__ == '__main__':
    main()


```
</template>

</CodeSwitcher>