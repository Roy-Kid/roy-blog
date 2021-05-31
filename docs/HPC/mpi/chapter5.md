---
title: 第五章- 停, 别卷了!
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

这个例子介绍了如何在一个进程中终止通信域中其他所有进程. 

<CodeSwitcher :languages="{C:'C', python:'Python'}">
<template v-slot:C>

```c
#include <mpi/mpi.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(argc, argv) int argc;
char *argv[];
{

    int rank, size;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    if (size < 2)
    {
        fprintf(stderr, "systest requires at least 2 processes");
        MPI_Abort(MPI_COMM_WORLD, 1);
    }

    int masternode = size - 1;

    if (rank == masternode)
    {
        double starttime, endtime;
        starttime = MPI_Wtime();
        while (1){
            endtime = MPI_Wtime();
            sleep(1);
            if ((endtime-starttime) >= 1) break;
        }
        fprintf(stderr, "rank=%d is masternode, exec Abort!\n", rank);
        MPI_Abort(MPI_COMM_WORLD, 99);
    }
    else
    {
        fprintf(stderr, "rank=%d is not masternode, exec Barrier!\n", rank);
        MPI_Barrier(MPI_COMM_WORLD);
    }
    MPI_Finalize();
}

```

</template>

<template v-slot:python>

```python

from mpi4py import MPI

def main():

    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()

    mastercode = size - 1

    if rank == mastercode:

        starttime = MPI.Wtime()
        while True:
            endtime = MPI.Wtime()
            if (endtime - starttime >= 1): break
        print(f"rank={rank} is masternode, exec Abort!", flush=True)
        comm.Abort()

    else:
        print(f"rank={rank} is not masternode, exec Barrier!", flush=True)
        comm.Barrier()

if __name__ == '__main__':
    main()

```
</template>
</CodeSwitcher>

我们令"最后"一个进程为主进程, 等候一秒后终止其他的进程. 而其他的进程则打印完"exec Barrier!"之后使用`comm.Barrier()`进行等待. 从中我们还可以看出一个规律, 即如果MPI标准中需要传入`MPI_COMM_WORLD`通讯域, 则在`mpi4py`中使用`comm.method()`进行调用; 如果是`MPI_`开头接口, 则直接`MPI.Method()`.

