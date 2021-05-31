---
title: 第六章- 传火
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

这一章给出一个数据接力的例子. 每一个进程都把数据向其后的进程传递, 直到最后一个进程终止.

@flowstart

st=>start: Start
p0=>operation: proc 0
p1=>operation: proc 1
pd=>operation: ...
pn=>operation: proc N-1

e=>end: End

st->p0
p0->p1
p1->pd
pd->pn
pn->e

@flowend

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

#include <mpi/mpi.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char *argv[])
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

    char msg[6] = "fire!";
    int msglen = 6;

    MPI_Status status;

    if (rank == 0) {

        MPI_Send(&msg, msglen, MPI_CHAR, rank+1, 0, MPI_COMM_WORLD);
        printf("%d send %s to   %d\n", rank, msg, rank+1);

    }
    else {

        MPI_Recv(&msg, msglen, MPI_CHAR, rank-1, 0, MPI_COMM_WORLD, &status);
        printf("%d recv %s from %d\n", rank, msg, rank-1);
        if (rank < size-1){
            MPI_Send(&msg, msglen, MPI_CHAR, rank+1, 0, MPI_COMM_WORLD);
            printf("%d send %s to   %d\n", rank, msg, rank+1);
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

def main():

    comm = MPI.COMM_WORLD
    rank = comm.Get_rank()
    size = comm.Get_size()

    msg = 'fire!'

    if rank == 0:
        comm.send(msg, dest=rank+1, tag=1)
        print(f'{rank} send {msg} to   {rank+1}')
    
    else:
        msg = comm.recv(source=rank-1, tag=1)
        print(f'{rank} recv {msg} from {rank-1}')
        if rank < size-1:
            comm.send(msg, rank+1, tag=1)
            print(f'{rank} send {msg} to   {rank+1}')

if __name__ == '__main__':
    main()

```
</template>

</CodeSwitcher>
