---
title: 第一章- Hello World in Cython
date: 2021-06-02
categories:
 - HPC
tags:
 - Cython
sidebar: 'auto'
---

鉴于Cython可以运行所有的Python代码, 所以现在最难的是搞清楚怎么去编译这个扩展

创建一个`hello.pyx`: 

```python
print('Hello World')
```

和一个`setup.py`:

```python
from setuptools import setup
from Cython.Build import cythonize

setup(
    ext_modules = cythonize("helloworld.pyx")
)
```

再运行:

```bash
python setup.py build_ext --inplace
```
就可以得到`.so`(unix) 或者`.pyd`(windows), 这两个文件都可以像一般的`.py`一样导入.

有个问题是如果不想每次修改过代码都编译, 或者不想用`.so`, 可以使用这种方法直接载入`.pyx`:

```python
import pyximport
pyximport.install()
import helloworld

helloworld.sayhi()
```

`pyximport`包还有一个实验性的功能, 就是把所有的`.py`和`.pyx`都用Cython编译后导入, 不过在很多标准库上表现不好, 因为导入机制太过垃圾.
`pyximport.install(pyimport=True)`就可以实现了. 不过推荐还是将预先编译好的文件打包成[wheel](https://wheel.readthedocs.io/)格式分发.

我们跳过文档中斐波那契数列的例子, 直接介绍如何使用C语言的数据类型去声明变量. 新建`primes.pyx`, 运行后找到素数然后以Python list的格式返回.

```python
def primes(int nb_primes):
    cdef int n, i, len_p
    cdef int p[1000]
    if nb_primes > 1000:
        nb_primes = 1000

    len_p = 0  # The current number of elements in p.
    n = 2
    while len_p < nb_primes:
        # Is n prime?
        for i in p[:len_p]:
            if n % i == 0:
                break

        # If no break occurred in the loop, we have a prime.
        else:
            p[len_p] = n
            len_p += 1
        n += 1

    # Let's return the result in a python list:
    result_as_list = [prime for prime in p[:len_p]]
    return result_as_list
```

就和一般的Python长得一样! 除了`nb_primes`这个参数有着`int`声明, 当入参传进来的时候会转换成C的`int`(如果转换失败的话报`TypeError`的错)

接下来有两个`cdef`的声明, 就像C一样声明了三个整型和一个整型数组. 下方的一个判断强制要求查找范围不能过大, 是由于内存机制的问题, 整型数组不能过大, 但是你可以用Python的list和NumPy的array来无缝替代.

在查找完所有的素数之后, 最后一步我们需要把C的整型数组转换回Python的list. C的`int`到Python的`int`就不需要手动转换了, 编译器会自动完成. 这里是类型转换的[说明](https://cython.readthedocs.io/en/latest/src/userguide/language_basics.html#type-conversion). 

插一嘴, 处理字符串最麻烦了. 首先C语言的字符串要么是储存成字符数组, 要么就是指向字符串的指针. 我们先这么操作好了

```python
    cdef char *s = b'string'
```

同样, 编译, 运行, 像一般的Python文件一样导入即可.

如果你好奇有哪些地方是经过`Python’s C-API`处理, 将`setup.py`更改为`cythonize(annotate=True)`. 随后会生成一个`HTML`文件. 其中黄色越深的地方越Python, 颜色越浅越C. 很Python的地方需要转换成C的代码, 点行号旁边的加号可以看到经过了那些转换和处理. 很有意思的是为什么`if n % i == 0`还标黄了, 分明这么C. 是因为Cython默认是Python的行为模式, 因此在运行的过程中会反复执行这一代码, 而不是像C一样被编译器优化掉. 可以通过[compiler directives](https://cython.readthedocs.io/en/latest/src/userguide/source_files_and_compilation.html#compiler-directives)取消这一操作. 

如果把上面的素数程序全拿Python写, 用没用Cython的速度能查一倍; 如果用了`cdef`这样的类型标注, 可以快13倍. 

注意几点:

1. 对于上面这种计算量小的程序, 尽量少地使用Python解释器, 因为这种开销实在很大;
2. 用C的时候, 很多东西能加载到缓存中, 而Python中万物皆对象, 而对象是字典的形式, 而字典对缓存很不友好;
3. 即便这样, 也不要`cdef`满天飞. 加之前先profile一下看看瓶颈在哪. 让代码易读更重要.


当然你也可以用C++来写:

```python
# distutils: language=c++

from libcpp.vector cimport vector

def primes(unsigned int nb_primes):
    cdef int n, i
    cdef vector[int] p
    p.reserve(nb_primes)  # allocate memory for 'nb_primes' elements.

    n = 2
    while p.size() < nb_primes:  # size() for vectors is similar to len()
        for i in p:
            if n % i == 0:
                break
        else:
            p.push_back(n)  # push_back is similar to append()
        n += 1

    # Vectors are automatically converted to Python
    # lists when converted to Python objects.
    return p
```
第一行告诉编译器把你的代码翻译成C++, 但是`pyximport`就不能用了, 你得手动编译或者用jupyter来跑这个例子. vector的语法和list很像, 所以有些时候可以考虑这样替换Python中的对象.
