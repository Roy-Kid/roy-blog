---
title: 第二章- Hello World, MPI!
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

为了测试我们环境是否真正地配置完成, 我们首先写个hello world.


<CodeSwitcher :languages="{C:'C', python:'Python'}">
<template v-slot:C>

```c
#include <mpi/mpi.h>
#include "stdio.h"
#include <math.h>

int main(argc, argv)
    int argc; char *argv[];
    {
        int rank, size;
        int namelen;
        char processor_name[MPI_MAX_PROCESSOR_NAME];

        MPI_Init(&argc, &argv);
        MPI_Comm_rank(MPI_COMM_WORLD, &rank);
        MPI_Comm_size(MPI_COMM_WORLD, &size);
        MPI_Get_processor_name(processor_name, &namelen);
        
        // do something
        fprintf(stderr, "Hello World! Process %d of %d on %s\n", rank, size, processor_name);

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
    processor_name = MPI.Get_processor_name()

    # do something
    print(f'Hello World! Process {rank} of total {size} in {processor_name}')

if __name__ == "__main__":
    main()

```

</template>
</CodeSwitcher>


这是第一个C/Python+MPI并行程序, 它的程序结构和FORTRAN77+MPI的完全相
同, 但对于不同的调用, 在形式和语法上有所不同. 由于多数人(其实是我)已经不会再写Fortran了, 所以以后的示例都由C/Python完成. 下面分几个部分对它的结构进行介绍. 

第一部分: 首先要有MPI相对于C实现的头文件mpi.h, 而不是mpif.h, 这和FORTRAN77
是不同的. 而在python中, 导入的是`mpi4py`包; 

第二部分: 定义程序中所需要的与MPI有关的变量`MPI_MAX_PROCESSOR_NAME`是
MPI预定义的宏--即某一MPI的具体实现中允许机器名字的最大长度. 机器名放在变量`processor_name`中, 这和FORTRAN77中的没有区别. 整型变量`rank`和`size`分别用来记
录某一个并行执行进程的标识和所有参加计算的进程的个数, namelen是实际得到的机器名
字的长度; 

第三部分; MPI程序的开始和结束必须是`MPI_Init`和`MPI_Finalize`, 分别完成MPI程序的
初始化和结束工作. 在C中则是以 `MPI_` 开头 后面的部分第一个字母大写
而其它的后续部分小写. `mpi4py`实现中, 可以不用显式地声明`MPI_Init`和`MPI_Finalize`, 而是通过`comm = MPI.COMM_WORLD`来获取通信域.

第四部分: MPI程序的程序体, 包括各种MPI过程调用语句和C语句`MPI_Comm_rank`
得到当前正在运行的进程的标识号, 放在rank中. `MPI_Comm_size`得到所有参加运算的进
程的个数, 放在`size`中. `MPI_Get_processor_name`得到本进程运行的机器的名称, 结果
放在`processor_name`中. 它是一个字符串, 而该字符串的长度放在`namelen`中. fprintf语句将
本进程的标识号, 并行执行的进程的个数, 本进程所运行的机器的名字打印出来. 和一般的
C程序不同的是这些程序体中的执行语句是并行执行的, 每一个进程都要执行. Python程序同理, 使用`comm.Get_rank()`得到当前进程的标识号, `comm.Get_size`得到所有参加运算的进程的个数, `MPI.Get_processor_name()`得到本进程运行的机器的名称. 

::: tip
大多数MPI程序都需要在每一个进程获取当前的标志号`rank`和所有进程个数`size`, C语言的话还需要`MPI_INIT()`和`MPI_FINALIZE()`, 所以不妨把它们做成一个代码片段.
:::
```json

	"mpi scaffold": {
		"prefix": "mpi_scaffold",
		"body": [
			"#include <mpi/mpi.h>",
			"#include <stdio.h>",
			"#include <string.h>",
			"$1\n",
			
			"int main(int argc, char *argv[]) {",

		
					"\tint rank, size;",
			
					"\tMPI_Init(&argc, &argv);",
					"\tMPI_Comm_rank(MPI_COMM_WORLD, &rank);",
					"\tMPI_Comm_size(MPI_COMM_WORLD, &size);\n",
					"\tMPI_Status status;\n",
			
					"\t$2\n",

					"\tMPI_Finalize();\n",
				"}",
		]
	}

```

如何去运行这两段程序. 对于C的代码, 最好使用C编译器的wrapper`mpicc`来编译, 再执行; 而python代码, 可以直接运行:

<CodeSwitcher :languages="{C:'C', python:'Python'}">
<template v-slot:C>

```c

mpicc ${file} -o ${fileBasenameNoExtension}.out -g -Wall -static-libgcc -std=c11

mpirun -np nprocs ./${fileBasenameNoExtension}.out

```

</template>

<template v-slot:python>

```python

mpirun -np nprocs python ${file}

```
</template>
</CodeSwitcher>

这里的`nprocs`是进程的数目, 如果我们指定同时启动四个程序, 那么可以得到输出

```bash
rank 0 of size 4 in Roy-Main
rank 1 of size 4 in Roy-Main
rank 2 of size 4 in Roy-Main
rank 3 of size 4 in Roy-Main
```

如果该程序在4台不同的机器上执行, 由于4个进程同时执行则其最终的执行结果不一定按照顺序. 在本程序中没有限定打印
语句的顺序, 因此不管哪个进程的打印语句在前, 哪个在后, 都没有关系, 只要有4条正确
的输出语句即可.
