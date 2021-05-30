---
title: 第一章- 安装
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

## 关于mpich

这里建议使用MPICH, [官网链接](http://www.mpich.org/)下载源码, 然后编译:

```bash
tar -zxvf mpich3.tar.gz #解压缩
./configure # 如果安装到其他路径，注意环境变量的问题。
make
make install
```
如果使用的是Ubuntu系统, 可以直接使用

```bash
sudo apt install mpich
```
安装成功之后, 使用`mpirun --version`可以查看版本及配置信息. 

## 关于mpi4py

既然C语言有着MPI的绑定, 那么python也应该有实现MPI的办法. 这里我们使用一个第三方库[mpi4py](https://github.com/mpi4py/mpi4py). 这个第三方库使用的是Cython语法, 目前兼容到mpich3. 
