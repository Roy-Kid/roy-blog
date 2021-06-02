---
title: 第九章- 两种基本模式
date: 2021-06-02
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

MPI的两种最基本的并行程序设计模式, 即对等模式和主从模式, 可以说绝大
部分MPI的程序都是这两种模式之一或二者的组合. 掌握了这两种模式,就掌握了MPI并行
程序设计的主线.
**对等模式**的MPI程序, 本章是通过一个典型的例子--Jacobi迭代来逐步讲解的, 并
且将每一种具体的实现都和特定的MPI增强功能结合起来, 达到既介绍并行程序设计方法
又讲解MPI特定功能调用的目的. 
**主从模式**的MPI程序, 是通过几个简单的例子来讲解主从进程功能的划分和主从进
程之间的交互作用. 

MPI程序一般是SPMD程序, 当然也可以用MPI来编写MPMD程序. 但是, 所有的MPMD
程序, 都可以用SPMD程序来表达. 二者的表达能力是相同的.

对于MPI的SPMD程序, 实现对等模式的问题是比较容易理解和接受的, 因为各个部分
地位相同, 功能和代码基本一致, 只不过是处理的数据或对象不同, 也容易用同样的程序来
实现. 但是对于主从模式的问题, 用SPMD程序来实现是否合适呢? 不管是从理论的角度,
还是从下面具体例子的实践, 都说明了主从模式的问题是完全可以用SPMD程序来高效解决
的. 即SPMD程序有很强的表达能力, SPMD只是形式上的表现, 其内容可以是十分丰富的.
本书中介绍的所有例子都是SPMD形式的程序.

## 对等模式

Jacobi迭代是一种比较常见的迭代方法, 其核心部分可以用下面伪代码来描述. 简单地说,
Jacobi迭代得到的新值是原来旧值点相邻数值点的平均.
Jacobi迭代的局部性很好, 可以取得很高的并行性, 是并行计算中常见的一个例子. 将
参加迭代的数据按块分割后, 各块之间除了相邻的元素需要通信外, 在各块的内部可以完全
独立地并行计算. 随着计算规模的扩大, 通信的开销相对于计算来说比例会降低, 这将更有
利于提高并行效果. 

```
…
REAL A(N+1,N+1), B(N+1,N+1)
…
DO K=1,STEP
    DO J=1,N
        DO I=1,N
            B(I,J)=0.25*(A(I-1,J)+A(I+1,J)+A(I,J+1)+A(I,J-1))
        END DO
    END DO

    DO J=1,N
        DO I=1,N
            A(I,J)=B(I,J)
        END DO
    END DO
```

为了并行求解, 这里将参加迭代的数据按列进行分割, 并假设一共有4个进程同时并行
计算. 数据的分割结果如图

![decomposition](/mpi/cp9_1.png)

假设需要迭代的数据是MxM的二维数组A(M,M), 令 M=4*N, 按图示进行数据划分, 则
分布在四个不同进程上的数据分别是, 进程0 A(M,1:N),  进程1 A(M,N+1:2*N), 进程2
A(M,2\*N+1:3\*N), 进程3 A(M,3*N+1:M)

由于在迭代过程中, 边界点新值的计算需要相邻边界其它块的数据, 因此在每一个数据
块的两侧又各增加1列的数据空间, 用于存放从相邻数据块通信得到的数据. 这样原来每个
数据块的大小从M\*N扩大到M\* N+2. 进程0和进程N-1的数据块只需扩大一块即可满足通信
的要求, 但这里为了编程的方便和形式的一致, 在两边都增加了数据块.

计算和通信过程是这样的: 首先对数组(指除去左右缓冲区的瓤)赋初值, 边界赋为8, 内部赋为0. 注意对不同的
进程, 赋值方式是不同的.

```
            proc 0            1              2            3
               mysize      
            0 8 8 8 8 8 | 8 8 8 8 8 8 | 8 8 8 8 8 8 | 8 8 8 8 8 0
            0 8 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 8 0
            0 8 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 8 0
            .
totalsize   .
            .
            0 8 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 8 0
            0 8 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 0 0 | 0 0 0 0 8 0
            0 8 8 8 8 8 | 8 8 8 8 8 8 | 8 8 8 8 8 8 | 8 8 8 8 8 0

```

然后开始进行Jacobi迭代. 在迭代之前, 每个进程都需要从相邻的进程得到数据块, 同时每一
个进程也都需要向相邻的进程提供数据块. 由于每一个新迭代点的值是由相邻点的旧值得到, 所以这里引入一个中间数组
用来记录临时得到的新值. 一次迭代完成后, 再统一进行更新操作

![transmition](\mpi\cp9_2.png)

这里的白色块是所谓的缓冲区, 用来储存邻居的数据信息; 绿色块则是二维数组A的边界. 经过交换之后, 每个进程都有了计算需要的全部数据

:::tip
我在写这个程序的时候犯了两个小错误. 
1.Fortran的数组是从1开始而c是从0开始;
2. 为了方便切片原程序是沿着行分为了四块, 我这里是按照列分为了四块, 因此需要
一个tmp数组来记录矩阵的边界值. 
:::

<CodeSwitcher :languages="{c:'C', python:'Python'}">
<template v-slot:c>

```c

```python

#include <mpi/mpi.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char *argv[])
{
    int rank, size;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    MPI_Status status;

    int totalsize = 16; // 矩阵大小
    int mysize = totalsize / 4, steps = 1;
    int n, i, j;
    float a[totalsize][mysize + 2];
    float b[totalsize][mysize + 2];

    int begin_col, end_col;

    // 初始化矩阵
    for (i = 0; i < totalsize; i++)
    {
        for (j = 0; j < mysize + 2; j++)
        {
            a[i][j] = 0.0;
            b[i][j] = 0.0;
        }
    }

    // 左边界赋为8
    if (rank == 0)
    {
        for (i = 0; i < totalsize; i++)
        {
            // a[i][0]和a[i][mysize+1]是邻居数据
            a[i][1] = 8.0;
        }
    }

    // 右边界赋为8
    if (rank == 3)
    {
        for (i = 0; i < totalsize; i++)
            // a[i][0]和a[i][mysize+1]是邻居数据
            a[i][mysize] = 8.0;
    }

    // 上下边界赋值
    for (j = 1; j < mysize + 1; j++)
    {
        a[0][j] = 8.0;
        a[totalsize - 1][j] = 8.0;
    }

    for (n = 0; n < steps; n++)
    {

        int tmp[totalsize];

        // !发送接受顺序不要乱, 这引出了死锁的问题

        // 接受来自右侧的数据, 放到右侧的缓冲区
        if (rank < 3)
        {

            MPI_Recv(&tmp, totalsize, MPI_REAL, rank + 1, 10, MPI_COMM_WORLD, &status);

            //printf("rank %d recv\n", rank);
            for (int i = 0; i < totalsize; i++)
            {
                a[i][mysize + 1] = tmp[i];
                //printf("%d ", tmp[i]);
            }
        }

        // 向左侧邻居发送数据
        // 将最左一列发送到上一个进程
        if (rank > 0)
        {

            for (int i = 0; i < totalsize; i++)
            {
                tmp[i] = a[i][1];
            }

            MPI_Send(&tmp, totalsize, MPI_REAL, rank - 1, 10, MPI_COMM_WORLD);
        }

        // 向右侧邻居发送数据
        // 将最右侧一列发送到下一个进程
        if (rank < 3)
        {

            for (int i = 0; i < totalsize; i++)
            {
                tmp[i] = a[i][mysize + 1];
            }

            MPI_Send(&tmp, totalsize, MPI_REAL, rank + 1, 10, MPI_COMM_WORLD);
        }

        // 接受来自左侧的数据, 放到左侧的缓冲区

        if (rank > 0)
        {

            MPI_Recv(&tmp, totalsize, MPI_REAL, rank - 1, 10, MPI_COMM_WORLD, &status);

            for (int i = 0; i < totalsize; i++)
            {
                a[i][1] = tmp[i];
            }
        }

        // 最左和最右的矩阵不计算它们左右的缓冲区
        begin_col = 0;
        end_col = mysize + 1;
        if (rank == 0)
            begin_col = 1;
        if (rank == 3)
            end_col = mysize;

        for (j = begin_col; j < end_col + 1; j++)
        {
            for (i = 1; i < totalsize - 1; i++)
            {
                b[i][j] = (a[i][j + 1] + a[i][j - 1] + a[i + 1][j] + a[i - 1][j]) * 0.25;
            }
        }

        for (j = 1; j < mysize + 1; j++)
        {
            for (i = 1; i < totalsize - 1; i++)
            {
                a[i][j] = b[i][j];
            }
        }

        if (rank == 0)
        {
            printf(" check matrix result \n");
            for (int i = 0; i < totalsize; i++)
            {
                for (int j = 1; j < mysize + 1; j++)
                {

                    printf("%.1f ", a[i][j]);
                    // fflush(stdout);
                }
                printf("\n");
            }
            printf("-------\n\n");
        }
    }

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

    totalsize = 16;
    mysize = int(totalsize/4)
    step = 1
    a = np.zeros((mysize+2, totalsize))
    b = np.zeros((mysize+2, totalsize))

    if rank == 0:
        a[1] = 8
    
    if rank == 3:
        a[mysize] = 8


    a[:, 0] = 8
    a[:, totalsize-1] = 8

    for _ in range(step):

        if rank < 3:
            comm.Recv(a[-1], source=rank+1, tag=1)

        if rank > 0:
            comm.Send(a[1], dest=rank-1, tag=1)

        if rank < 3:
            comm.Send(a[-2], dest=rank+1, tag=2)

        if rank > 0:
            comm.Recv(a[0], source=rank-1, tag=2)

    begin_raw = 1
    end_raw = mysize

    if rank == 0:
        begin_raw = 2
    if rank == 3:
        end_raw = mysize  - 1

    for i in range(begin_raw, end_raw+1):
        for j in range(1, totalsize-1):
            b[i][j] = (a[i][j+1] + a[i][j-1] + a[i+1][j]+ a[i-1][j])*0.25

    for i in range(1, mysize+1):
        for j in range(1, totalsize-1):
            a[i][j] = b[i][j]

    print(rank)
    print(a)

if __name__ == '__main__':
    main()

```
</template>

</CodeSwitcher>

:::tip
mpi4py好像不允许接受切片索引的array, 所以python版的我把它横了过来, 改成了按行切片.
这俩程序好像有一丢丢小问题需要改正
:::