---
title: 第一章- Ewald summation
date: 2021-08-01
categories:
 - MD
tags:
 - FF
sidebar: 'auto'
---

> 整理自 Frenkel & Smit - Understanding Molecular Simulation: From Algorithms to Application

近程相互作用最显著的特征是相互作用是随距离的增加而迅速衰减. 例如经典的lj12-6势描述下, 粒子的相互作用是以$r^{-6}$衰减的, 因此可以认为, 在$2.5\sigma$之外的粒子作用寥寥, 即便是截断(trunction)也无大碍. 

长程作用不然, 如静电力和偶极作用, 是以$r^{-1}$衰减, 引入截断是万万不可的. 一方面, 如果截断太小, 计算量是$O(N^2)$; 另一方面, 这个求和是条件收敛的. 对于阶段之外的误差能量, 可以写作:

$$
\mathcal{U}^{\text {tail }}=\frac{N \rho}{2} \int_{r_{c}}^{\infty} \mathrm{dr} u(r) 4 \pi r^{2} \tag{1}
$$

其中$\rho$是数密度. 这个公式是对截断势的不收敛的描述, 除非$u(r)$的衰减比$r^{-3}$更快才能接受. 这就是为什么不能将截断和尾修正用于长程作用里的原因. 这一章我们要介绍Ewald求和方法, 这是一系列计算长程作用力方法的基础.

## 物理图像

首先我们考虑一个长宽高都为$L$的盒子, 体积为$V=L^3$, 三个方向均为周期性边界条件. 盒子里均匀充满带电离子, 总数为$N$, 有$\Sigma_i q_i = 0$. 我们希望了能计算这个体系的库仑力对总能量的贡献:

$$
    U_{Coul} = \frac{1}{2}\Sigma_{i=1}^{N} q_i\phi(r_i) \tag{2}
$$

其中$\phi(r_i)$是离子$i$的静电势:

$$
\phi\left(r_{i}\right)=\sum_{j, \mathbf{n}}^{\prime} \frac{q_{j}}{\left|\mathbf{r}_{i j}+\mathbf{n L}\right|} \tag{3}
$$

简明起见, 这里使用了高斯单位. 其中, 大撇($\prime$)指出, 我们不计算在相同镜像中的同一个粒子之间的相互作用. 求和号下的j是对所有与i相互所用的粒子, 而n则是全部的镜像. 因此$|\mathbf{r}_{i j}+\mathbf{n L}|$则涵盖了不同镜像间所以粒子的距离(每相差一个镜像, 距离都会增加一个盒子边长). 公式$2$指出, 势能是随着$1/r$衰减.

为了解决这个问题, 我们在每个点电荷周围假想一个电性相反, 电量相同的电荷分布. 这个分布可以是任意的表达形式, 我们以分布宽度为$\sqrt{2/\alpha}$的高斯分布为例:

$$
\rho_{\text {Gauss }}(r)=-q_{i}(\alpha / \pi)^{\frac{3}{2}} \exp \left(-\alpha r^{2}\right)
$$

这个电荷分布抵消了点电荷, 但是因为是用电荷分布去抵消相同电量的点电荷, 又没有完全抵消, 所以两者差的部分是以$1/R^2$衰减的, 因此可以像短程作用力一样快速衰减. 我们称这一部分为屏蔽电荷(screened charge).

其中, $\alpha$的选取与计算效率有关. 有加就有减, 我们还需要将用一个修正的(conpensating)电荷分布去抵消假想的电荷分布. 这个物理图像的示意图如下:

!(ewald)(/md/ewald.jpg)

左图为真实的物理图像. 由于体系是点电荷, 所以电荷密度是$\delta$-函数的形式. (TODO: griffiths p30). 右图上是点电荷和以其为中心的高斯分布的假想电荷, 右下是用以抵消假想电荷的电荷分布. 很明显, 以前直接计算库伦势将拆分为三部分, 首先是屏蔽电荷间的相互作用, 修正电荷的相互作用, 和实空间中假想电荷和点电荷的自相互作用. 

## 补偿电荷的相互作用

坐标$r$处的修正电荷的电荷密度记作:

$$
\rho_{1}(r)=\sum_{j=1}^{N} \sum_{\mathbf{n}} \mathrm{q}_{j}(\alpha / \pi)^{\frac{3}{2}} \exp \left(-\alpha\left|\mathbf{r}-\left(\mathbf{r}_{\mathfrak{j}}+\mathbf{n} \mathrm{L}\right)\right|^{2}\right)
$$

带入泊松方程, 可以求解电势$\phi_{1}(\mathrm{r})$

$$
-\nabla^{2} \phi_{1}(\mathrm{r})=4 \pi \rho_{1}(\mathrm{r})
$$

由于电荷密度是高斯形式, 且是在空间上是周期性的(周期性边界条件给出), 很自然可以想到使用傅里叶变换. 

$$
-\nabla^{2} \phi(\mathbf{r})=4 \pi \rho(\mathbf{r})
$$

其中$\phi(\mathbf{r})$ 是坐标$\mathbf{r}$处的静电势. 对于点电荷源, **这个**方程的解的库伦势部分是:

$$
\phi(\mathbf{r})=\frac{z}{4 \pi|\mathbf{r}|}
$$

对有N个点电荷的体系, 我们可以定义点电荷密度:

$$
\rho_{P}(\mathbf{r})=\sum_{i=1}^{N} q_{i} \delta\left(\mathbf{r}-\mathbf{r}_{i}\right)
$$

这里, $\mathbf{r}_{i}$是电荷i的位置, $q_i$是电量. 由于点电荷体积无限小, 因此只有在坐标处存在无限大的电荷密度, 其他地方为0.

在$\mathbf{r}_{i}$的电势来自于所有点电荷对这一点的电势的总和:

$$
\phi(\mathbf{r})=\sum_{i=1}^{N} \frac{q_{i}}{4 \pi\left|\mathbf{r}-\mathbf{r}_{i}\right|}
$$

回顾一下基本的傅里叶变换. 在周期性边界的, 长为L, 体积为V的立方盒子中, 任何一个坐标的函数都可以写作傅里叶级数:

$$
f(\mathbf{r})=\frac{1}{V} \sum_{I=-\infty}^{\infty} \tilde{f}(k) e^{\mathrm{i} \mathbf{k} \cdot r}
$$

其中, $\mathbf{k}=(2\pi/L)I, I=(l_x, l_y, l_z)$是傅里叶空间的格矢量. 而傅里叶因子$\tilde{f}(k)$为:

$$
\tilde{f}(\mathbf{k})=\int_{V} \mathrm{~d} \mathbf{r} f(\mathbf{r}) \mathrm{e}^{-\mathrm{i} \mathbf{k} \cdot \mathrm{r}}
$$

再返回泊松方程, 我们对方程左边进行傅里叶变换:

$$
\begin{aligned}
-\nabla^{2} \phi(\mathbf{r}) &=-\nabla^{2}\left(\frac{1}{V} \sum_{\mathbf{k}} \tilde{\phi}(\mathbf{k}) \mathrm{e}^{\mathrm{i}\mathbf{r} \cdot \mathbf{k}}\right) \\
&=\frac{1}{V} \sum_{\mathbf{k}} k^{2} \tilde{\phi}(\mathbf{k}) \mathrm{e}^{\mathrm{i}\mathbf{r} \cdot \mathbf{k}}
\end{aligned}
$$

电荷密度也是任意的周期函数, 也可以进行进行傅里叶变换:
$$
\rho(r)=\frac{1}{V} \sum_{\mathbf{k}} \tilde{\rho}(\mathbf{k}) \mathrm{e}^{\mathrm{i}\mathbf{r} \cdot \mathbf{k}}
$$

带回泊松方程, 得到其在傅里叶空间中的形式:

$$
k^{2} \tilde{\phi}(k)=4 \pi \tilde{\rho}(k)
$$

再返回之前的电荷密度表达式, 对其进行傅里叶变换

$$
\begin{aligned}
\rho_{1}(\mathbf{k}) &=\int_{V} \mathrm{~d} \mathbf{r} \exp (-\mathrm{i} \mathbf{k} \cdot \mathbf{r} ) \rho_{1}(\mathbf{r}) \\
&=\int_{V} \mathrm{~d} \mathbf{r} \exp (-i \mathbf{k} \cdot \mathbf{r}) \sum_{j-1}^{N} \sum_{\mathbf{n}} q_{j}(\alpha / \pi)^{\frac{3}{2}} \exp \left(-\alpha\left|\mathbf{r}-\left(\mathbf{r}_{\mathbf{j}}+\mathbf{n L}\right)\right|^{2}\right) \\
&=\int_{\text {all space }} \mathrm{dr} \exp (-\mathrm{i} \mathbf{k} \cdot \mathbf{r}) \sum_{j=1}^{N} \mathrm{q}_{j}(\alpha / \pi)^{\frac{3}{2}} \exp \left(-\alpha\left|\mathbf{r}-\mathbf{r}_{j}\right|^{2}\right) \\
&=\sum_{j=1}^{N} q_{j} \exp \left(-i \mathbf{k} \cdot \mathbf{r}_{j}\right) \exp \left(-k^{2} / 4 \alpha\right)
\end{aligned}
$$

带回到泊松方程表达式中, 我们有

$$
\phi_{1}(k)=\frac{4 \pi}{k^{2}} \sum_{j=1}^{N} q_{j} \exp \left(-i \mathbf{k} \cdot \mathbf{r}_{j}\right) \exp \left(-k^{2} / 4 \alpha\right)
$$

可以立刻注意到表达式只要在$\mathbf{k} \neq 0$成立, 这也是Ewald求和条件收敛的原因. 目前我们假设$\mathbf{k}=0$的项为$0$. 我们将在后面看到, 这个假设与周期系统嵌入无限介电常数介质的情况是一致的. 而且这个表达式只需要对所有的N个粒子求和即可, 复杂度降到了$O(N)$. 

现在, 我们可以计算由电势引起的势能函数. $\phi_{1}(k)$是倒空间中"位置"对电势的函数, 我们需要再进行一次傅里叶逆变换得到实空间的电势:

$$
\begin{aligned}
\phi_{1}(\mathrm{r}) &=\frac{1}{V} \sum_{\mathbf{k} \neq 0} \phi_{1}(\mathbf{k}) \exp (i \mathbf{k} \cdot \mathbf{r}) \\
&=\sum_{\mathbf{k} \neq 0} \sum_{j=1}^{N} \frac{4 \pi \mathrm{q}_{j}}{k^{2}} \exp \left(i \mathbf{k} \cdot\left(\mathbf{r}-\mathbf{r}_{j}\right)\right) \exp \left(-k^{2} / 4 \alpha\right)
\end{aligned}
$$

因此, 应用文章开头的势能函数, 我们有:

$$
\begin{aligned}
\mathcal{U}_{1} & \equiv \frac{1}{2} \sum_{i} q_{i} \phi_{1}\left(r_{i}\right) \\
&=\frac{1}{2} \sum_{\mathbf{k} \neq 0} \sum_{i, j=1}^{N} \frac{4 \pi q_{i} q_{j}}{V k^{2}} \exp \left(i \mathbf{k} \cdot\left(\mathbf{r}_{i}-\mathbf{r}_{j}\right)\right) \exp \left(-k^{2} / 4 \alpha\right) \\
&=\frac{1}{2 V} \sum_{\mathbf{k} \neq 0} \frac{4 \pi}{k^{2}}|\rho(\mathbf{k})|^{2} \exp \left(-k^{2} / 4 \alpha\right)
\end{aligned} \tag{17}
$$

其中,

$$
\rho(\mathbf{k}) \equiv \sum_{i=1}^{N} \mathrm{q}_{i} \exp \left(\mathrm{i} \mathbf{k} \cdot \mathbf{r}_{\mathfrak{i}}\right)
$$

## 自相互作用的修正

假想的高斯电荷分布和实际的点电荷之间本应无相互作用, 但公式$17$中多加上了$(1/2)q_i \phi_{self}(r_i)$这一项. 这一项的引入是在, 我们对所有的补偿电荷做了傅里叶变换, 得到了倒空间的电势, 然后变换回实空间, 然后对所有的点电荷求势能. 因此, 每一个补偿电荷实际上对点电荷本身都进行了一次计算, 所以需要修正. 再次给出电荷分布的高斯型:

$$
\rho_{\text {Gauss }}(r)=-q_{i}(\alpha / \pi)^{\frac{3}{2}} \exp \left(-\alpha r^{2}\right)
$$

然后用泊松方程计算电势

$$
-\frac{1}{r} \frac{\partial^{2} r \phi_{\text {Gauss }}(r)}{\partial r^{2}}=4 \pi \rho_{\text {Gauss }}(r)
$$

两次积分, 可得:

$$
\begin{aligned}
-\frac{\partial r \phi_{\text {Gauss }}(r)}{\partial r} &=\int_{\infty}^{r} \mathrm{~d} 4 \pi r \rho \text { Gauss }(r) \\
&=-2 \pi q_{i}(\alpha / \pi)^{\frac{3}{2}} \int_{r}^{\infty} d r^{2} \exp \left(-\alpha r^{2}\right) \\
&=-2 q_{i}(\alpha / \pi)^{\frac{1}{2}} \exp \left(-\alpha r^{2}\right)
\end{aligned}
$$

$$
\begin{aligned}
\phi_{\text {Gauss }}(r) &=2 \frac{q_{i}}{r}(\alpha / \pi)^{\frac{1}{2}} \int_{0}^{r} d r \exp \left(-\alpha r^{2}\right) \\
&=\frac{q_{i}}{r} \operatorname{erf}(\sqrt{\alpha} r)
\end{aligned}
$$
最后一行中的的误差函数(error function)是高斯积分的形式:

$$
\operatorname{erf}(x)=\frac{1}{\sqrt{\pi}} \int_{-x}^{x} e^{-t^{2}} \mathrm{~d} t=\frac{2}{\sqrt{\pi}} \int_{0}^{x} e^{-t^{2}} \mathrm{~d} t
$$

和自身的点电荷相互作用, 我们只需要计算$r=0$时的电势:

$$
\begin{aligned}
\phi_{\text {Gauss }}(r=0)
&=2q_{i}\sqrt{\alpha r}
\end{aligned}
$$

自相互作用引入的势能:

$$
\begin{aligned}
\mathcal{U}_{\text {self }} &=\frac{1}{2} \sum_{i=1}^{N} \mathrm{q}_{i} \phi_{\text {self }}\left(r_{i}\right) \\
&=(\alpha / \pi)^{\frac{1}{2}} \sum_{i=1}^{N} \mathrm{q}_{i}^{2} .
\end{aligned}
$$

可以注意到, 这一项并不依赖于粒子的位置.

## 实空间求和

最终, 我们来计算实空间的屏蔽电荷(点电荷+假想的具有高斯分布的电荷分布). 高斯分布的电荷密度的电势已经给出:

$$
\begin{aligned}
\phi_{\text {Gauss }}(r) &=\frac{q_{i}}{r} \operatorname{erf}(\sqrt{\alpha} r)
\end{aligned}
$$

我们可以立刻写出实空间的, 短程的相互作用:

$$
\begin{aligned}
\phi_{\text {short-range }}(r) &=\frac{q_{i}}{r}-\frac{q_{i}}{r} \operatorname{erf}(\sqrt{\alpha} r) \\
&=\frac{q_{i}}{r} \operatorname{erfc}(\sqrt{\alpha} r)
\end{aligned}
$$

最后一行的$\operatorname{erfc(x)} \equiv 1 - \operatorname{erf(x)} $. 粒子之间求和计算势能:

$$
\mathcal{U}_{\text {short-range }}=\frac{1}{2} \sum_{i \neq j}^{N} q_{i} q_{j} \operatorname{erfc}\left(\sqrt{\alpha} r_{i j}\right) / r_{i j}
$$

长程库仑力的总势能至此可以给出了:

$$
\mathcal{U}_\text{库伦力} = \mathcal{U}_\text{实空间屏蔽电荷间} + \mathcal{U}_\text{倒空间假想电荷分布间} - \mathcal{U}_\text{自相互作用}
$$

## 附1: 如果不是高斯分布呢?

这里我们引入傅里叶变换的另一个性质--卷积. 如果我们有一个函数$f_1({x})$, 是另两个函数的卷积:

$$
f_{1}(x)=f_{2}(x) \star f_{3}(x) \equiv \int d x^{\prime} f_{2}\left(x^{\prime}\right) f_{3}\left(x-x^{\prime}\right)
$$

那么这些函数的傅里叶系数有如下简单的关系:

$$
\tilde{f}_{1}(k)=\tilde{f}_{2}(k) \tilde{f}_{3}(k)
$$

因此, 如果有一个不是点电荷那么尖锐的电荷分布, 而是更加"平缓(smeared)"的, 有:

$$
\rho(\mathbf{r})=\sum_{i} \mathrm{q}_{i} \gamma\left(\mathbf{r}-\mathbf{r}_{i}\right)=\int \mathrm{d} \mathbf{r}^{\prime} \gamma\left(\mathbf{r}^{\prime}\right) \rho_{p}\left(\mathbf{r}-\mathbf{r}^{\prime}\right)
$$

其中$\gamma\left(\mathbf{r}\right)$就是单电荷的电荷分布的"形状", 在傅里叶空间中的泊松方程也可以给出:

$$
\tilde{\phi}(k)=\tilde{g}(k) \tilde{\gamma}(k) \tilde{\rho}_{P}(k)
$$